// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

/// 日志落盘状态（第 18 条令新增）。
/// 首次写入时确保目录存在；文件超 5MB 则截断重开。
static LOG_READY: Mutex<bool> = Mutex::new(false);

/// 桌面端日志文件路径：~/Library/Logs/Otto/webview.log
fn log_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    PathBuf::from(home)
        .join("Library/Logs/Otto")
        .join("webview.log")
}

/// 追加一行（带本地时间戳）到 webview.log；目录不存在则创建，>5MB 则截断。
fn append_log(line: &str) {
    let path = log_path();
    let mut ready = match LOG_READY.lock() {
        Ok(g) => g,
        Err(_) => return,
    };
    if !*ready {
        if let Some(dir) = path.parent() {
            let _ = fs::create_dir_all(dir);
        }
        *ready = true;
    }
    // 超 5MB 截断
    if let Ok(meta) = fs::metadata(&path) {
        if meta.len() > 5 * 1024 * 1024 {
            let _ = fs::write(&path, b"");
        }
    }
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&path) {
        let ts = timestamp();
        let _ = writeln!(f, "[{}] {}", ts, line);
    }
}

/// 本地时间戳（YYYY-MM-DD HH:MM:SS.mmm），不依赖 chrono。
fn timestamp() -> String {
    // 用 SystemTime + 简单换算，避免引入新依赖。
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();
    let millis = now.subsec_millis();
    // 本地时区偏移（Asia/Shanghai = UTC+8，硬编码以零依赖换取确定性）
    let local = secs + 8 * 3600;
    let days = local / 86400;
    let rem = local % 86400;
    let (h, mi, s) = (rem / 3600, (rem % 3600) / 60, rem % 60);
    // 从 1970-01-01 起的天数换算年月日
    let mut year = 1970i64;
    let mut d = days as i64;
    loop {
        let leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
        let ylen = if leap { 366 } else { 365 };
        if d < ylen {
            break;
        }
        d -= ylen;
        year += 1;
    }
    let leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    let mdays = [
        31,
        if leap { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    let mut month = 1;
    for m in mdays.iter() {
        if d < *m {
            break;
        }
        d -= *m;
        month += 1;
    }
    format!(
        "{:04}-{:02}-{:02} {:02}:{:02}:{:02}.{:03}",
        year,
        month,
        d + 1,
        h,
        mi,
        s,
        millis
    )
}

/// Console/log bridge: 由注入脚本调用，把 WebView 内的运行时报错写进 Rust stdout + 日志文件。
/// 纯调试用，不参与业务逻辑。
#[tauri::command]
fn __bridge_log(msg: String) {
    println!("[WEBVIEW] {}", msg);
    append_log(&format!("[WEBVIEW] {}", msg));
}

/// 注入到每个页面（页面加载完成时执行）的探针脚本。
/// 劫持 window.onerror / unhandledrejection / console.error，
/// 通过 __TAURI_INTERNALS__.invoke 回传（Tauri 2 无条件注入该内部对象，
/// 不依赖 withGlobalTauri）。
///
/// 第 18 条令增强：补 #app tagName / innerHTML 前缀、location.href+hash、
/// token 存在性、body 长度；并把 Error 还原成 name/message/stack（避免 JSON.stringify 得 {}）。
const BRIDGE_JS: &str = r#"
(function () {
  if (window.__OTTO_BRIDGE_INSTALLED__) return;
  window.__OTTO_BRIDGE_INSTALLED__ = true;

  function send(level, payload) {
    try {
      var msg = '[' + level + '] ' + payload;
      if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
        window.__TAURI_INTERNALS__.invoke('__bridge_log', { msg: msg });
      }
    } catch (e) { /* 静默 */ }
  }

  // 把任意参数还原为可读字符串：Error 取 name/message/stack，普通对象试 JSON，
  // 失败则 String()，避免出现无信息的 "{}"。
  function describe(a) {
    if (a === null) return 'null';
    if (a === undefined) return 'undefined';
    if (typeof a === 'string') return a;
    if (a instanceof Error) {
      return 'Error: ' + a.name + ': ' + a.message
        + (a.stack ? '\nSTACK: ' + a.stack : '');
    }
    if (typeof a === 'object') {
      var out;
      try { out = JSON.stringify(a); } catch (e) { out = null; }
      if (out === '{}' || out === null || out === undefined) {
        // 空对象或循环引用：降级为构造器名 + 自有键
        var keys = [];
        try { keys = Object.keys(a); } catch (e) {}
        return (a.constructor && a.constructor.name ? a.constructor.name : 'Object')
          + '{' + keys.join(',') + '}';
      }
      return out;
    }
    return String(a);
  }

  function appInfo(tag) {
    var app = document.getElementById('app');
    var html = '';
    var nodes = -1;
    if (app) {
      nodes = app.childNodes.length;
      try { html = (app.innerHTML || '').replace(/\s+/g, ' ').slice(0, 300); } catch (e) {}
    }
    var key1 = null, key2 = null;
    try {
      key1 = localStorage.getItem('otto_access_token') ? 'yes' : 'no';
      key2 = localStorage.getItem('otto_build_version') || 'none';
    } catch (e) {}
    var bodyLen = -1;
    try { bodyLen = (document.body && document.body.innerHTML || '').length; } catch (e) {}
    return '[' + tag + '] url=' + location.href
      + '; hash=' + (location.hash || '(empty)')
      + '; #app=' + (app ? ('present, nodes=' + nodes) : 'MISSING')
      + '; token=' + key1
      + '; buildVer=' + key2
      + '; bodyLen=' + bodyLen
      + '; #appHTML=' + html;
  }

  send('BOOT', 'bridge installed; readyState=' + document.readyState
    + '; url=' + location.href
    + '; interns=' + (!!(window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke))
    + '; isTauri=' + (window.isTauri === true));

  window.addEventListener('error', function (ev) {
    var t = ev && ev.target;
    if (t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK' || t.tagName === 'IMG')) {
      send('RESOURCE', 'failed to load <' + t.tagName.toLowerCase() + '> src='
        + (t.src || t.href || '?'));
      return;
    }
    var err = ev && ev.error;
    send('ERROR', (ev && ev.message ? ev.message : 'unknown')
      + ' @ ' + (ev && ev.filename ? ev.filename : '?')
      + ':' + (ev && ev.lineno !== undefined ? ev.lineno : '?')
      + ':' + (ev && ev.colno !== undefined ? ev.colno : '?')
      + (err && err.stack ? '\nSTACK: ' + err.stack : ''));
  }, true);

  window.addEventListener('unhandledrejection', function (ev) {
    var r = ev && ev.reason;
    send('REJECTION', describe(r));
  });

  var origErr = console.error;
  console.error = function () {
    try {
      send('CONSOLE.ERROR', Array.prototype.map.call(arguments, describe).join(' '));
    } catch (e) { /* 静默 */ }
    return origErr.apply(console, arguments);
  };

  window.addEventListener('DOMContentLoaded', function () {
    send('DOM', appInfo('DOMContentLoaded'));
  });

  window.addEventListener('load', function () {
    send('LOAD', appInfo('window.load'));
    // 再延迟 1.5s 抓一次，捕捉异步 mount / 守卫重定向后的终态
    setTimeout(function () { send('SETTLED', appInfo('settled+1500ms')); }, 1500);
  });
})();
"#;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![__bridge_log])
        .on_page_load(|webview, payload| {
            println!(
                "[BRIDGE] page_load url={} event={:?}",
                payload.url(),
                payload.event()
            );
            append_log(&format!(
                "[BRIDGE] page_load url={} event={:?}",
                payload.url(),
                payload.event()
            ));
            if let Err(e) = webview.eval(BRIDGE_JS) {
                println!("[BRIDGE] eval failed: {e}");
                append_log(&format!("[BRIDGE] eval failed: {e}"));
            }
        })
        .setup(|app| {
            // 页面加载完成前先注入一次，确保尽早捕获错误
            if let Some(w) = app.get_webview_window("main") {
                if let Err(e) = w.eval(BRIDGE_JS) {
                    println!("[BRIDGE] early eval failed: {e}");
                    append_log(&format!("[BRIDGE] early eval failed: {e}"));
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
