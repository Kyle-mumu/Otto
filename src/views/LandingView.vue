<template>
<div class="landing-page">

<!-- ===== Navigation ===== -->
<nav class="nav" role="navigation" aria-label="主导航">
  <div class="container">
    <router-link to="/" class="nav-logo" aria-label="Otto 首页">
      <div class="nav-logo-icon" aria-hidden="true">A</div>
      <span>Otto</span>
    </router-link>
    <ul class="nav-links">
      <li><a href="#pain">痛点</a></li>
      <li><a href="#how">工作原理</a></li>
      <li><a href="#features">功能对比</a></li>
      <li><a href="#pricing">定价</a></li>
      <li><a href="#faq">常见问题</a></li>
    </ul>
    <div class="nav-actions">
      <router-link to="/login" class="btn btn-ghost btn-sm">登录</router-link>
      <router-link to="/register" class="btn btn-primary btn-sm">免费试用</router-link>
      <button class="nav-toggle" aria-label="打开菜单" aria-expanded="false">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h14M3 10h14M3 14h14"/></svg>
      </button>
    </div>
  </div>
</nav>

<!-- ===== 1. Hero Section ===== -->
<section class="hero" id="hero">
  <div class="container">
    <div class="hero-content">
      <div class="hero-badge">
        <span class="hero-badge-dot" aria-hidden="true"></span>
        免费开源 · 5 分钟部署
      </div>
      <h1>你的团队还在每人各配一个 API Key？</h1>
      <p class="hero-subtitle">
        Otto 是小团队的 AI 办公操作系统 ——<br>
        统一管控模型额度，数据不出本机，经验自动沉淀。<br>
        5 人团队 5 分钟部署，免费开始。
      </p>
      <div class="hero-actions">
        <router-link to="/register" class="btn btn-primary btn-lg">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          免费试用，5 分钟部署
        </router-link>
        <a href="mailto:team@otto.ai" class="btn btn-secondary btn-lg">
          预约演示，了解详情
        </a>
      </div>
      <div class="hero-stats" aria-label="关键数据">
        <div class="hero-stat">
          <div class="hero-stat-value">5 分钟</div>
          <div class="hero-stat-label">Docker 一键部署</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">↓ 40%</div>
          <div class="hero-stat-label">平均节省 AI 调用成本</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">100%</div>
          <div class="hero-stat-label">数据本地存储</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== 2. Pain Point Section ===== -->
<section class="section pain-section" id="pain">
  <div class="container">
    <div class="text-center">
      <div class="section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        痛点分析
      </div>
      <h2 class="section-title">小团队用 AI 的三个头疼问题</h2>
      <p class="section-subtitle">你是否也遇到过这些困扰？Otto 为每个问题提供了切实可行的解决方案。</p>
    </div>

    <div class="pain-grid">
      <div class="pain-card">
        <div class="pain-icon pain-icon-security" aria-hidden="true">
          <svg width="24" height="24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3>数据安全焦虑</h3>
        <p class="pain-desc">把客户资料、代码、商业计划喂给云端 AI，总觉得不踏实。</p>
        <div class="pain-solution">
          <svg width="16" height="16" fill="none" stroke="#065F46" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8l5 5L16 4"/></svg>
          Agent 在你本机执行，数据不出局域网
        </div>
      </div>

      <div class="pain-card">
        <div class="pain-icon pain-icon-cost" aria-hidden="true">
          <svg width="24" height="24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <h3>费用失控</h3>
        <p class="pain-desc">每人各自买 API Key，月底账单吓一跳，还不知道谁花的。</p>
        <div class="pain-solution">
          <svg width="16" height="16" fill="none" stroke="#065F46" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8l5 5L16 4"/></svg>
          团队统一配额管理，按人/按模型精细分配
        </div>
      </div>

      <div class="pain-card">
        <div class="pain-icon pain-icon-knowledge" aria-hidden="true">
          <svg width="24" height="24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h3>经验全靠人传人</h3>
        <p class="pain-desc">好的 AI 用法存在某个人脑子里，人一走全没了。</p>
        <div class="pain-solution">
          <svg width="16" height="16" fill="none" stroke="#065F46" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8l5 5L16 4"/></svg>
          Agent 执行完毕自动提取工作流，团队经验库自动增长
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== 3. How It Works ===== -->
<section class="section how-section" id="how">
  <div class="container">
    <div class="text-center">
      <div class="section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        快速上手
      </div>
      <h2 class="section-title">3 步开始，5 分钟搞定</h2>
      <p class="section-subtitle">从零到团队 AI 协作，只需三步。</p>
    </div>

    <div class="steps-wrapper">
      <div class="step-card">
        <div class="step-number" aria-hidden="true">1</div>
        <h3>创建团队，接入模型</h3>
        <p>管理员注册，输入 API Key，设置团队额度</p>
        <div class="step-detail">
          支持 OpenAI、DeepSeek、Claude、通义千问等所有 OpenAI 兼容 API。一个团队可接入多个模型，按需分配。
        </div>
      </div>

      <div class="step-card">
        <div class="step-number" aria-hidden="true">2</div>
        <h3>下发任务，Agent 自动执行</h3>
        <p>创建任务卡，Agent 在本地执行，实时查看进度</p>
        <div class="step-detail">
          Agent 拥有完整本机权限，操作真实文件和浏览器。执行过程实时同步日志，任务卡一键推送飞书/企微。
        </div>
      </div>

      <div class="step-card">
        <div class="step-number" aria-hidden="true">3</div>
        <h3>经验自动沉淀，一键复用</h3>
        <p>AI 自动提取工作流步骤，团队经验库 +1</p>
        <div class="step-detail">
          执行完毕后 AI 自动提取结构化经验摘要，新人可直接复用，上手时间从 2 周缩短到 3 天。
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== 4. Feature Comparison ===== -->
<section class="section feature-section" id="features">
  <div class="container">
    <div class="text-center">
      <div class="section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
        功能对比
      </div>
      <h2 class="section-title">为什么选择 Otto？</h2>
      <p class="section-subtitle">核心功能全面对比，Otto 在本地执行和经验沉淀上有独特优势。</p>
    </div>

    <div class="feature-table-wrapper" role="region" aria-label="功能对比表" tabindex="0">
      <table class="feature-table">
        <thead>
          <tr>
            <th>功能</th>
            <th>Otto</th>
            <th>Dify</th>
            <th>Coze</th>
            <th>FastGPT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>本地 Agent 执行</td>
            <td><span class="feature-check" aria-label="支持">✓</span><br><small style="color:var(--gray-500);font-size:12px">数据不出本机</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span><br><small style="color:var(--gray-400);font-size:12px">云端沙盒</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span><br><small style="color:var(--gray-400);font-size:12px">云端</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span><br><small style="color:var(--gray-400);font-size:12px">云端</small></td>
          </tr>
          <tr>
            <td>经验自动沉淀</td>
            <td><span class="feature-check" aria-label="支持">✓</span><br><small style="color:var(--gray-500);font-size:12px">零人工</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span><br><small style="color:var(--gray-400);font-size:12px">手动整理</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span><br><small style="color:var(--gray-400);font-size:12px">手动</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span><br><small style="color:var(--gray-400);font-size:12px">手动</small></td>
          </tr>
          <tr>
            <td>任务卡 + IM 集成</td>
            <td><span class="feature-check" aria-label="支持">✓</span><br><small style="color:var(--gray-500);font-size:12px">飞书/企微</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span><br><small style="color:var(--gray-400);font-size:12px">无</small></td>
            <td><span class="feature-partial" aria-label="部分支持">⚠️</span><br><small style="color:var(--gray-400);font-size:12px">仅飞书</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span><br><small style="color:var(--gray-400);font-size:12px">无</small></td>
          </tr>
          <tr>
            <td>模型额度管控</td>
            <td><span class="feature-check" aria-label="支持">✓</span><br><small style="color:var(--gray-500);font-size:12px">按人/按模型</small></td>
            <td><span class="feature-partial" aria-label="部分支持">⚠️</span><br><small style="color:var(--gray-400);font-size:12px">基础</small></td>
            <td><span class="feature-partial" aria-label="部分支持">⚠️</span><br><small style="color:var(--gray-400);font-size:12px">基础</small></td>
            <td><span class="feature-partial" aria-label="部分支持">⚠️</span><br><small style="color:var(--gray-400);font-size:12px">基础</small></td>
          </tr>
          <tr>
            <td>免费层</td>
            <td><span class="feature-check" aria-label="支持">✓</span><br><small style="color:var(--gray-500);font-size:12px">3人/5K tokens</small></td>
            <td><span class="feature-partial" aria-label="有限">⚠️</span><br><small style="color:var(--gray-400);font-size:12px">有限</small></td>
            <td><span class="feature-check" aria-label="支持">✓</span><br><small style="color:var(--gray-500);font-size:12px">免费</small></td>
            <td><span class="feature-partial" aria-label="有限">⚠️</span><br><small style="color:var(--gray-400);font-size:12px">有限</small></td>
          </tr>
          <tr>
            <td>端到端加密</td>
            <td><span class="feature-check" aria-label="支持">✓</span><br><small style="color:var(--gray-500);font-size:12px">V1.1</small></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span></td>
            <td><span class="feature-cross" aria-label="不支持">✕</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- ===== 5. Social Proof ===== -->
<section class="section proof-section" id="proof">
  <div class="container">
    <div class="text-center">
      <div class="section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        用户评价
      </div>
      <h2 class="section-title">他们在用 Otto</h2>
      <p class="section-subtitle">来自真实团队的使用反馈。</p>
    </div>

    <div class="proof-grid">
      <div class="proof-card">
        <p class="proof-quote">"我们 5 人外包团队，以前每人各买 GPT-4 Key，月底账单 ¥3000+。用了 Otto 之后统一管控，同样的工作量降到 ¥1200。"</p>
        <div class="proof-author">
          <div class="proof-avatar" aria-hidden="true">李</div>
          <div class="proof-author-info">
            <span class="proof-author-name">李工</span>
            <span class="proof-author-role">某软件外包团队技术负责人</span>
          </div>
        </div>
      </div>

      <div class="proof-card">
        <p class="proof-quote">"最打动我的是经验自动沉淀。以前新人来了要老人带两周，现在打开经验库直接复用工作流，3 天就能上手。"</p>
        <div class="proof-author">
          <div class="proof-avatar" aria-hidden="true">张</div>
          <div class="proof-author-info">
            <span class="proof-author-name">张主管</span>
            <span class="proof-author-role">某电商代运营团队主管</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== 6. Pricing Section ===== -->
<section class="section pricing-section" id="pricing">
  <div class="container">
    <div class="text-center">
      <div class="section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        定价方案
      </div>
      <h2 class="section-title">免费开始，按需升级</h2>
      <p class="section-subtitle">核心功能全部开放，不限制功能，只限制规模。</p>
    </div>

    <div class="pricing-grid">
      <div class="pricing-card">
        <div class="pricing-name">免费版</div>
        <div class="pricing-price">¥0</div>
        <div class="pricing-desc">适合个人或小型试用</div>
        <ul class="pricing-features">
          <li><span class="check" aria-hidden="true">✓</span> 团队人数 <span class="limit">≤ 3 人</span></li>
          <li><span class="check" aria-hidden="true">✓</span> 模型接入 <span class="limit">2 个</span></li>
          <li><span class="check" aria-hidden="true">✓</span> Token 额度 <span class="limit">5,000/人/天</span></li>
          <li><span class="check" aria-hidden="true">✓</span> 经验库 <span class="limit">20 条</span></li>
          <li><span class="check" aria-hidden="true">✓</span> IM 集成</li>
          <li><span class="check" aria-hidden="true">✓</span> 远程加密</li>
        </ul>
        <router-link to="/register" class="btn btn-secondary">立即注册</router-link>
      </div>

      <div class="pricing-card featured">
        <div class="pricing-name">Pro</div>
        <div class="pricing-price">¥199<span>/月</span></div>
        <div class="pricing-desc">适合 5-20 人成长团队</div>
        <ul class="pricing-features">
          <li><span class="check" aria-hidden="true">✓</span> 团队人数 <span class="limit">≤ 20 人</span></li>
          <li><span class="check" aria-hidden="true">✓</span> 模型接入 <span class="limit">无限</span></li>
          <li><span class="check" aria-hidden="true">✓</span> Token 额度 <span class="limit">100,000/人/天</span></li>
          <li><span class="check" aria-hidden="true">✓</span> 经验库 <span class="limit">无限</span></li>
          <li><span class="check" aria-hidden="true">✓</span> IM 集成</li>
          <li><span class="check" aria-hidden="true">✓</span> 远程加密</li>
        </ul>
        <router-link to="/register" class="btn btn-primary">开始试用</router-link>
      </div>

      <div class="pricing-card">
        <div class="pricing-name">Enterprise</div>
        <div class="pricing-price">定制</div>
        <div class="pricing-desc">适合大型团队或私有部署</div>
        <ul class="pricing-features">
          <li><span class="check" aria-hidden="true">✓</span> 团队人数 <span class="limit">不限</span></li>
          <li><span class="check" aria-hidden="true">✓</span> 模型接入 <span class="limit">无限</span></li>
          <li><span class="check" aria-hidden="true">✓</span> Token 额度 <span class="limit">自定义</span></li>
          <li><span class="check" aria-hidden="true">✓</span> 经验库 <span class="limit">无限</span></li>
          <li><span class="check" aria-hidden="true">✓</span> IM 集成</li>
          <li><span class="check" aria-hidden="true">✓</span> 完全私有部署</li>
        </ul>
        <a href="mailto:team@otto.ai" class="btn btn-secondary">联系我们</a>
      </div>
    </div>

    <p class="pricing-note">所有版本均支持 14 天无理由退款。不确定选哪个？先用免费版试试。</p>
  </div>
</section>

<!-- ===== 7. FAQ Section ===== -->
<section class="section faq-section" id="faq">
  <div class="container">
    <div class="text-center">
      <div class="section-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
        常见问题
      </div>
      <h2 class="section-title">常见问题解答</h2>
      <p class="section-subtitle">关于 Otto 的常见疑问，如有更多问题欢迎联系我们。</p>
    </div>

    <div class="faq-list">
      <div v-for="(item, index) in faqItems" :key="index" class="faq-item" :class="{ active: activeFaq === index }">
        <button class="faq-question" :aria-expanded="activeFaq === index" @click="toggleFaq(index)">
          {{ item.question }}
          <svg class="faq-chevron" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-answer" role="region">
          <div class="faq-answer-inner">
            {{ item.answer }}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===== 8. Final CTA ===== -->
<section class="section cta-section" id="cta">
  <div class="container">
    <h2 class="section-title">5 分钟部署，让团队 AI 协作效率翻倍</h2>
    <p class="section-subtitle">加入正在使用 Otto 的团队，开启本地 AI 协作新时代。</p>
    <router-link to="/register" class="btn btn-primary btn-lg">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      免费开始
    </router-link>
    <div class="cta-hints">
      <span class="cta-hint">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 8l5 5L16 4"/></svg>
        无需信用卡
      </span>
      <span class="cta-hint">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 8l5 5L16 4"/></svg>
        14 天无理由退款
      </span>
      <span class="cta-hint">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 8l5 5L16 4"/></svg>
        支持 Docker 一键部署
      </span>
    </div>
  </div>
</section>

<!-- ===== Footer ===== -->
<footer class="footer" role="contentinfo">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-brand-name">
          <div class="nav-logo-icon" style="width:24px;height:24px;font-size:12px;border-radius:4px" aria-hidden="true">A</div>
          Otto
        </div>
        <p class="footer-brand-desc">小团队的 AI 办公操作系统。统一管控模型额度，数据不出本机，经验自动沉淀。</p>
      </div>
      <div class="footer-col">
        <h4>产品</h4>
        <ul>
          <li><a href="#">功能介绍</a></li>
          <li><a href="#">定价方案</a></li>
          <li><a href="#">更新日志</a></li>
          <li><a href="#">路线图</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>资源</h4>
        <ul>
          <li><a href="#">文档中心</a></li>
          <li><a href="#">API 参考</a></li>
          <li><a href="#">部署指南</a></li>
          <li><a href="#">社区</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>关于</h4>
        <ul>
          <li><a href="#">关于我们</a></li>
          <li><a href="#">联系方式</a></li>
          <li><a href="#">隐私政策</a></li>
          <li><a href="#">服务条款</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Otto. All rights reserved.</span>
      <span>用 ❤️ 为小团队打造</span>
    </div>
  </div>
</footer>

</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ========== FAQ Accordion ==========
const activeFaq = ref<number | null>(null)

const faqItems = [
  {
    question: '我的数据安全吗？',
    answer: 'Otto 的 Agent 在你自己的电脑上执行，代码、文件、客户资料永远不会上传到云端。只有结构化的经验摘要（不含原始数据）会同步到团队知识库。V1.1 将支持端到端加密。'
  },
  {
    question: '我们团队不懂技术，能用吗？',
    answer: 'V1.0 需要一定的技术基础来部署（提供 Docker 一键部署脚本）。V1.1 将推出云端托管版本，零技术门槛。'
  },
  {
    question: '支持哪些 AI 模型？',
    answer: '支持所有 OpenAI 兼容 API（OpenAI、DeepSeek、Claude、通义千问、智谱等）。一个团队可以接入多个模型，按需分配。'
  },
  {
    question: '免费版有什么限制？',
    answer: '免费版支持 3 人团队、2 个模型、每人每天 5000 tokens。核心功能（Agent 执行、经验沉淀、IM 集成、远程加密）全部开放，不限制功能，只限制规模。'
  },
  {
    question: '能私有部署吗？',
    answer: '可以。Enterprise 版支持完全私有部署，数据、模型、经验库全部在你自己的服务器上。'
  }
]

function toggleFaq(index: number) {
  activeFaq.value = activeFaq.value === index ? null : index
}

// ========== Smooth Scroll for Nav Links ==========
function handleNavClick(e: Event) {
  const link = e.target as HTMLAnchorElement
  if (link.getAttribute('href')?.startsWith('#')) {
    e.preventDefault()
    const target = document.querySelector(link.getAttribute('href')!)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

// ========== Nav Shadow on Scroll ==========
function handleScroll() {
  const nav = document.querySelector('.nav') as HTMLElement
  if (nav) {
    nav.style.boxShadow = window.scrollY > 10 ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none'
  }
}

onMounted(() => {
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.addEventListener('click', handleNavClick)
  })
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.removeEventListener('click', handleNavClick)
  })
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* ===== Design Token System (T03) ===== */
:deep(.landing-page) {
  --primary-50: #EEF2FF;
  --primary-100: #E0E7FF;
  --primary-200: #C7D2FE;
  --primary-300: #A5B4FC;
  --primary-400: #818CF8;
  --primary-500: #6366F1;
  --primary-600: #4F46E5;
  --primary-700: #4338CA;
  --primary-800: #3730A3;
  --primary-900: #312E81;

  --success: #10B981;
  --success-light: #D1FAE5;
  --warning: #F59E0B;
  --warning-light: #FEF3C7;
  --error: #EF4444;
  --error-light: #FEE2E2;
  --info: #3B82F6;
  --info-light: #DBEAFE;

  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;

  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  --ease-fast: 150ms ease;
  --ease-normal: 300ms ease;
}
</style>

<style>
/* Non-scoped: landing page styles must apply to template elements */
.landing-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #1F2937;
  background: #FFFFFF;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.landing-page * { box-sizing: border-box; }
.landing-page img { max-width: 100%; display: block; }
.landing-page a { color: inherit; text-decoration: none; }

/* ===== Utility ===== */
.landing-page .container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .landing-page .container { padding: 0 24px; }
}
@media (min-width: 1280px) {
  .landing-page .container { padding: 0 32px; }
}

.landing-page .section {
  padding: 64px 0;
}

@media (min-width: 768px) {
  .landing-page .section { padding: 80px 0; }
}
@media (min-width: 1280px) {
  .landing-page .section { padding: 96px 0; }
}

.landing-page .section-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #4F46E5;
  background: #EEF2FF;
  padding: 6px 14px;
  border-radius: 9999px;
  margin-bottom: 16px;
  letter-spacing: 0.02em;
}

.landing-page .section-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .landing-page .section-title { font-size: 36px; }
}

.landing-page .section-subtitle {
  font-size: 16px;
  color: #6B7280;
  max-width: 640px;
  margin: 0 auto 48px;
  line-height: 1.7;
}

.landing-page .text-center { text-align: center; }

/* ===== Buttons ===== */
.landing-page .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 600;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  border-radius: 6px;
  text-decoration: none;
  white-space: nowrap;
}

.landing-page .btn:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

.landing-page .btn-primary {
  background: #6366F1;
  color: #FFFFFF;
  padding: 14px 28px;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 0 0 1px rgba(99,102,241,0.2);
}

.landing-page .btn-primary:hover {
  background: #4F46E5;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 0 0 1px rgba(99,102,241,0.3);
  transform: translateY(-1px);
}

.landing-page .btn-primary:active {
  background: #4338CA;
  transform: translateY(0);
}

.landing-page .btn-lg {
  padding: 16px 36px;
  font-size: 17px;
  border-radius: 8px;
}

.landing-page .btn-secondary {
  background: #FFFFFF;
  color: #374151;
  padding: 14px 28px;
  border: 1px solid #D1D5DB;
}

.landing-page .btn-secondary:hover {
  border-color: #6366F1;
  color: #4F46E5;
  background: #EEF2FF;
}

.landing-page .btn-ghost {
  background: transparent;
  color: #4F46E5;
  padding: 14px 28px;
}

.landing-page .btn-ghost:hover {
  background: #EEF2FF;
}

.landing-page .btn-sm {
  padding: 10px 20px;
  font-size: 14px;
}

/* ===== Top Nav ===== */
.landing-page .nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #E5E7EB;
  height: 64px;
  display: flex;
  align-items: center;
}

.landing-page .nav .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.landing-page .nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.landing-page .nav-logo-icon {
  width: 32px;
  height: 32px;
  background: #6366F1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  font-size: 16px;
  font-weight: 800;
}

.landing-page .nav-links {
  display: none;
  list-style: none;
  gap: 32px;
}

@media (min-width: 768px) {
  .landing-page .nav-links { display: flex; }
}

.landing-page .nav-links a {
  font-size: 14px;
  font-weight: 500;
  color: #4B5563;
  transition: color 150ms ease;
}

.landing-page .nav-links a:hover { color: #4F46E5; }

.landing-page .nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ===== Hero Section ===== */
.landing-page .hero {
  position: relative;
  padding: calc(64px + 64px) 0 64px;
  background: linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 40%, #E0E7FF 100%);
  overflow: hidden;
}

@media (min-width: 768px) {
  .landing-page .hero {
    padding: calc(64px + 80px) 0 80px;
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}

.landing-page .hero::before {
  content: '';
  position: absolute;
  top: -200px;
  right: -200px;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.landing-page .hero::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%);
  pointer-events: none;
}

.landing-page .hero .container {
  position: relative;
  z-index: 1;
}

.landing-page .hero-content {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}

.landing-page .hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 9999px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #4338CA;
  margin-bottom: 24px;
}

.landing-page .hero-badge-dot {
  width: 6px;
  height: 6px;
  background: #10B981;
  border-radius: 50%;
  animation: lp-pulse 2s infinite;
}

@keyframes lp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.landing-page .hero h1 {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

@media (min-width: 768px) {
  .landing-page .hero h1 { font-size: 48px; }
}

@media (min-width: 1280px) {
  .landing-page .hero h1 { font-size: 54px; }
}

.landing-page .hero-subtitle {
  font-size: 17px;
  color: #4B5563;
  line-height: 1.75;
  margin-bottom: 32px;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 768px) {
  .landing-page .hero-subtitle { font-size: 18px; }
}

.landing-page .hero-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

@media (min-width: 640px) {
  .landing-page .hero-actions {
    flex-direction: row;
    justify-content: center;
  }
}

.landing-page .hero-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  padding-top: 32px;
  border-top: 1px solid rgba(99,102,241,0.15);
}

@media (min-width: 768px) {
  .landing-page .hero-stats { gap: 40px; }
}

.landing-page .hero-stat {
  text-align: center;
}

.landing-page .hero-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #4338CA;
}

@media (min-width: 768px) {
  .landing-page .hero-stat-value { font-size: 24px; }
}

.landing-page .hero-stat-label {
  font-size: 13px;
  color: #6B7280;
  margin-top: 2px;
}

/* ===== Pain Point Section ===== */
.landing-page .pain-section {
  background: #FFFFFF;
}

.landing-page .pain-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .landing-page .pain-grid { grid-template-columns: repeat(3, 1fr); }
}

.landing-page .pain-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 32px;
  transition: all 300ms ease;
  position: relative;
  overflow: hidden;
}

.landing-page .pain-card:hover {
  border-color: #C7D2FE;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: translateY(-4px);
}

.landing-page .pain-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #6366F1;
  opacity: 0;
  transition: opacity 300ms ease;
}

.landing-page .pain-card:hover::before { opacity: 1; }

.landing-page .pain-icon {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 20px;
}

.landing-page .pain-icon-security { background: #FEE2E2; }
.landing-page .pain-icon-cost { background: #FEF3C7; }
.landing-page .pain-icon-knowledge { background: #DBEAFE; }

.landing-page .pain-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.landing-page .pain-desc {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.7;
  margin-bottom: 20px;
}

.landing-page .pain-solution {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: #D1FAE5;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #065F46;
  line-height: 1.5;
}

.landing-page .pain-solution svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ===== How It Works ===== */
.landing-page .how-section {
  background: #F9FAFB;
}

.landing-page .steps-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  position: relative;
}

@media (min-width: 768px) {
  .landing-page .steps-wrapper {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

.landing-page .step-card {
  text-align: center;
  position: relative;
}

.landing-page .step-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #6366F1;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  position: relative;
  z-index: 2;
}

@media (min-width: 768px) {
  .landing-page .step-card:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 24px;
    left: calc(50% + 32px);
    width: calc(100% - 64px);
    height: 2px;
    background: #C7D2FE;
    z-index: 1;
  }
}

.landing-page .step-card h3 {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.landing-page .step-card p {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.7;
  max-width: 280px;
  margin: 0 auto;
}

.landing-page .step-detail {
  margin-top: 16px;
  padding: 16px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  font-size: 13px;
  color: #4B5563;
  line-height: 1.6;
  text-align: left;
}

/* ===== Feature Comparison ===== */
.landing-page .feature-section {
  background: #FFFFFF;
}

.landing-page .feature-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  background: #FFFFFF;
}

.landing-page .feature-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
}

.landing-page .feature-table thead th {
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border-bottom: 2px solid #E5E7EB;
  background: #F9FAFB;
  color: #374151;
}

.landing-page .feature-table thead th:first-child {
  text-align: left;
  color: #4B5563;
}

.landing-page .feature-table thead th:nth-child(2) {
  background: #EEF2FF;
  color: #4338CA;
  border-bottom-color: #A5B4FC;
}

.landing-page .feature-table tbody td {
  padding: 16px 20px;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px solid #F3F4F6;
  color: #4B5563;
}

.landing-page .feature-table tbody td:first-child {
  text-align: left;
  font-weight: 500;
  color: #1F2937;
}

.landing-page .feature-table tbody td:nth-child(2) {
  background: rgba(99,102,241,0.03);
}

.landing-page .feature-table tbody tr:last-child td {
  border-bottom: none;
}

.landing-page .feature-check {
  color: #10B981;
  font-size: 18px;
}

.landing-page .feature-cross {
  color: #D1D5DB;
  font-size: 18px;
}

.landing-page .feature-partial {
  color: #F59E0B;
  font-size: 13px;
  font-weight: 500;
}

/* ===== Social Proof ===== */
.landing-page .proof-section {
  background: #F9FAFB;
}

.landing-page .proof-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .landing-page .proof-grid { grid-template-columns: repeat(2, 1fr); }
}

.landing-page .proof-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 32px;
  position: relative;
}

.landing-page .proof-card::before {
  content: '"';
  position: absolute;
  top: 16px;
  right: 24px;
  font-size: 64px;
  font-weight: 800;
  color: #E0E7FF;
  line-height: 1;
  font-family: Georgia, serif;
}

.landing-page .proof-quote {
  font-size: 15px;
  color: #374151;
  line-height: 1.8;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.landing-page .proof-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.landing-page .proof-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #E0E7FF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #4F46E5;
}

.landing-page .proof-author-info {
  display: flex;
  flex-direction: column;
}

.landing-page .proof-author-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.landing-page .proof-author-role {
  font-size: 13px;
  color: #6B7280;
}

/* ===== Pricing Section ===== */
.landing-page .pricing-section {
  background: #FFFFFF;
}

.landing-page .pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
  align-items: start;
}

@media (min-width: 768px) {
  .landing-page .pricing-grid { grid-template-columns: repeat(3, 1fr); }
}

.landing-page .pricing-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  transition: all 300ms ease;
  position: relative;
}

.landing-page .pricing-card:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  transform: translateY(-4px);
}

.landing-page .pricing-card.featured {
  border-color: #818CF8;
  box-shadow: 0 0 0 1px #818CF8, 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.landing-page .pricing-card.featured::before {
  content: '最受欢迎';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #6366F1;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 16px;
  border-radius: 9999px;
}

.landing-page .pricing-name {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 8px;
}

.landing-page .pricing-price {
  font-size: 40px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.landing-page .pricing-price span {
  font-size: 16px;
  font-weight: 500;
  color: #6B7280;
}

.landing-page .pricing-desc {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 24px;
}

.landing-page .pricing-features {
  list-style: none;
  text-align: left;
  margin-bottom: 32px;
  padding: 0;
}

.landing-page .pricing-features li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #F3F4F6;
}

.landing-page .pricing-features li:last-child {
  border-bottom: none;
}

.landing-page .pricing-features .check {
  color: #10B981;
  flex-shrink: 0;
  font-size: 16px;
}

.landing-page .pricing-features .limit {
  font-size: 13px;
  color: #6B7280;
  margin-left: auto;
}

.landing-page .pricing-card .btn {
  width: 100%;
}

.landing-page .pricing-note {
  text-align: center;
  font-size: 14px;
  color: #6B7280;
  margin-top: 32px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* ===== FAQ Section ===== */
.landing-page .faq-section {
  background: #F9FAFB;
}

.landing-page .faq-list {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.landing-page .faq-item {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 150ms ease;
}

.landing-page .faq-item:hover {
  border-color: #C7D2FE;
}

.landing-page .faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  text-align: left;
  line-height: 1.5;
}

.landing-page .faq-question:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: -2px;
}

.landing-page .faq-chevron {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: #9CA3AF;
  transition: transform 150ms ease;
}

.landing-page .faq-item.active .faq-chevron {
  transform: rotate(180deg);
}

.landing-page .faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 300ms ease;
}

.landing-page .faq-item.active .faq-answer {
  max-height: 300px;
}

.landing-page .faq-answer-inner {
  padding: 0 24px 20px;
  font-size: 14px;
  color: #4B5563;
  line-height: 1.8;
}

/* ===== Final CTA ===== */
.landing-page .cta-section {
  background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%);
  color: #FFFFFF;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.landing-page .cta-section::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none;
}

.landing-page .cta-section .section-title {
  color: #FFFFFF;
}

.landing-page .cta-section .section-subtitle {
  color: rgba(255,255,255,0.8);
}

.landing-page .cta-section .btn-primary {
  background: #FFFFFF;
  color: #4338CA;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.landing-page .cta-section .btn-primary:hover {
  background: #F3F4F6;
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.landing-page .cta-hints {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}

.landing-page .cta-hint {
  display: flex;
  align-items: center;
  gap: 8px;
}

.landing-page .cta-hint svg {
  color: rgba(255,255,255,0.5);
}

/* ===== Footer ===== */
.landing-page .footer {
  background: #111827;
  color: #9CA3AF;
  padding: 40px 0 24px;
}

.landing-page .footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

@media (min-width: 640px) {
  .landing-page .footer-grid { grid-template-columns: 2fr 1fr 1fr; }
}

@media (min-width: 768px) {
  .landing-page .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
}

.landing-page .footer-brand {
  max-width: 280px;
}

.landing-page .footer-brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.landing-page .footer-brand-desc {
  font-size: 14px;
  line-height: 1.7;
  color: #9CA3AF;
}

.landing-page .footer-col h4 {
  font-size: 13px;
  font-weight: 600;
  color: #D1D5DB;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.landing-page .footer-col ul {
  list-style: none;
  padding: 0;
}

.landing-page .footer-col li {
  margin-bottom: 8px;
}

.landing-page .footer-col a {
  font-size: 14px;
  color: #9CA3AF;
  transition: color 150ms ease;
}

.landing-page .footer-col a:hover { color: #FFFFFF; }

.landing-page .footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  font-size: 13px;
}

@media (min-width: 640px) {
  .landing-page .footer-bottom {
    flex-direction: row;
    justify-content: space-between;
  }
}

/* ===== Animations ===== */
@media (prefers-reduced-motion: reduce) {
  .landing-page *, .landing-page *::before, .landing-page *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ===== Mobile Menu Toggle ===== */
.landing-page .nav-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  color: #374151;
  border-radius: 6px;
}

.landing-page .nav-toggle:hover {
  background: #F3F4F6;
}

@media (min-width: 768px) {
  .landing-page .nav-toggle { display: none; }
}

/* ===== Scrollbar ===== */
.landing-page .feature-table-wrapper::-webkit-scrollbar {
  height: 6px;
}

.landing-page .feature-table-wrapper::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 3px;
}

.landing-page .feature-table-wrapper::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}
</style>
