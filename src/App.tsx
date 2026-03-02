import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Calendar, Clock, MonitorPlay, Users, ArrowRight, BookOpen, Code, Lightbulb, Terminal, Shield, ArrowUpRight } from 'lucide-react';

const CLAUDE_ICON = "https://storage.googleapis.com/aistudio-user-content/0-7050098001740456623-1740460244747.png";
const CLAUDE_CODE_LOGO = "https://storage.googleapis.com/aistudio-user-content/1-7050098001740456623-1740460244747.png";

// Unsplash Images
const IMG_HERO = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=2000&q=80";
const IMG_TEAM = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80";
const IMG_CODE = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80";
const IMG_DAY1 = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1600&q=80";
const IMG_DAY2 = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80";

function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-[#d97757] text-white font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(217,119,87,0.4)] ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// --- Terminal Animation Logic ---
const terminalSequence = [
  { type: 'cmd', text: 'claude', typingSpeed: 100, postDelay: 800 },
  { type: 'info', text: 'Welcome to Claude Code (v0.1.0)', postDelay: 300 },
  { type: 'info', text: 'Initializing agent environment...', postDelay: 600 },
  { type: 'info', text: 'Ready.', postDelay: 400 },
  { type: 'prompt', text: '売上ダッシュボードを作って。CSVを読み込んで、月次推移のグラフと前年比が表示されるようにして。', typingSpeed: 60, postDelay: 800 },
  { type: 'claude', text: '了解しました。以下の手順で進めます：', postDelay: 600 },
  { type: 'claude', text: '1. CSVファイルの読み込みとデータ整形', postDelay: 300 },
  { type: 'claude', text: '2. 月次推移グラフ（Recharts）の作成', postDelay: 300 },
  { type: 'claude', text: '3. 前年比サマリーのUI実装', postDelay: 600 },
  { type: 'tool', text: '▶ Running tool: fs_read', postDelay: 400 },
  { type: 'tool_result', text: '  Read sales_data.csv (1,240 rows)', postDelay: 800 },
  { type: 'tool', text: '▶ Running tool: fs_write', postDelay: 500 },
  { type: 'tool_result', text: '  Created src/components/SalesDashboard.tsx', postDelay: 1200 },
  { type: 'claude', text: 'ダッシュボードの実装が完了しました。', postDelay: 400 },
  { type: 'claude', text: '開発サーバーを起動してプレビューしますか？ [Y/n]', postDelay: 5000 },
  { type: 'clear', text: '', postDelay: 500 }
];

function useTerminalAnimation(sequence: any[]) {
  const [displayedLines, setDisplayedLines] = useState<{type: string, text: string}[]>([]);
  const [currentTyping, setCurrentTyping] = useState('');
  const [activeLineType, setActiveLineType] = useState('');
  
  useEffect(() => {
    let isCancelled = false;
    
    const runSequence = async () => {
      while (!isCancelled) {
        setDisplayedLines([]);
        setCurrentTyping('');
        
        await new Promise(r => setTimeout(r, 1000));
        
        for (const step of sequence) {
          if (isCancelled) break;
          
          if (step.type === 'clear') {
            await new Promise(r => setTimeout(r, step.postDelay));
            continue;
          }
          
          if (step.typingSpeed) {
            setActiveLineType(step.type);
            let typed = '';
            for (let i = 0; i < step.text.length; i++) {
              if (isCancelled) break;
              typed += step.text[i];
              setCurrentTyping(typed);
              await new Promise(r => setTimeout(r, step.typingSpeed + Math.random() * 30));
            }
            if (isCancelled) break;
            setDisplayedLines(prev => [...prev, { type: step.type, text: step.text }]);
            setCurrentTyping('');
            setActiveLineType('');
          } else {
            setDisplayedLines(prev => [...prev, { type: step.type, text: step.text }]);
          }
          
          await new Promise(r => setTimeout(r, step.postDelay));
        }
      }
    };
    
    runSequence();
    return () => { isCancelled = true; };
  }, [sequence]);
  
  return { displayedLines, currentTyping, activeLineType };
}

function TerminalLine({ type, text, isTyping }: { type: string, text: string, isTyping?: boolean, key?: React.Key }) {
  const cursor = isTyping ? <span className="inline-block w-2.5 h-4 bg-white/70 ml-1 animate-pulse align-middle"></span> : null;
  
  if (type === 'cmd') {
    return <div className="text-gray-200"><span className="text-emerald-400 font-bold mr-2">$</span>{text}{cursor}</div>;
  }
  if (type === 'info') {
    return <div className="text-gray-500">{text}</div>;
  }
  if (type === 'prompt') {
    return <div className="text-gray-200 mt-3"><span className="text-[#d97757] font-bold mr-2">&gt;</span>{text}{cursor}</div>;
  }
  if (type === 'claude') {
    return <div className="text-gray-300">{text}</div>;
  }
  if (type === 'tool') {
    return <div className="text-blue-400 mt-2">{text}</div>;
  }
  if (type === 'tool_result') {
    return <div className="text-gray-500">{text}</div>;
  }
  return <div>{text}</div>;
}

function TerminalWindow() {
  const { displayedLines, currentTyping, activeLineType } = useTerminalAnimation(terminalSequence);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedLines, currentTyping]);

  return (
    <div className="w-full max-w-2xl rounded-2xl overflow-hidden bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="bg-[#1a1a1a]/80 px-4 py-3 flex items-center gap-2 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        <div className="ml-4 text-xs text-gray-400 font-mono">claude-code — bash</div>
      </div>
      {/* Body */}
      <div 
        ref={containerRef}
        className="p-6 font-mono text-sm leading-relaxed h-[420px] overflow-y-auto flex flex-col gap-1.5 scroll-smooth"
      >
        {displayedLines.map((line, i) => (
          <TerminalLine key={i} type={line.type} text={line.text} />
        ))}
        {currentTyping !== '' && (
          <TerminalLine type={activeLineType} text={currentTyping} isTyping />
        )}
        {/* Blinking cursor when idle */}
        {currentTyping === '' && displayedLines.length > 0 && displayedLines[displayedLines.length - 1].type !== 'clear' && (
          <div className="mt-1"><span className="inline-block w-2.5 h-4 bg-white/50 animate-pulse align-middle"></span></div>
        )}
        {currentTyping === '' && displayedLines.length === 0 && (
          <div className="text-gray-300"><span className="text-emerald-400 font-bold mr-2">$</span><span className="inline-block w-2.5 h-4 bg-white/70 animate-pulse align-middle"></span></div>
        )}
      </div>
    </div>
  );
}
// --- End Terminal Animation Logic ---

export default function App() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-[#e8e6dc] text-[#141413] font-sans selection:bg-[#d97757] selection:text-white">
      {/* Navbar - Glassmorphism */}
      <nav className="fixed top-0 left-0 w-full z-50 glass-panel">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight flex items-center gap-3">
            <img src={CLAUDE_ICON} alt="Logo" className="w-6 h-6" />
            <span className="hidden sm:inline">AI Core Skills</span>
          </div>
          <button className="bg-[#141413] hover:bg-[#d97757] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 flex items-center gap-2">
            お問い合わせ <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section - 2026 Modern Split/Overlap */}
      <section className="relative min-h-[100svh] flex items-center pt-20 overflow-hidden">
        {/* Parallax Background Image */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute top-0 right-0 w-full lg:w-full h-[80vh] lg:h-full z-0"
        >
          <img 
            src={IMG_HERO} 
            alt="AI Abstract" 
            className="w-full h-full object-cover image-mask-bottom lg:image-mask-right opacity-30 mix-blend-multiply"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="w-full lg:w-1/2 pt-20 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#141413]/10 bg-white/50 backdrop-blur-md text-[#141413] font-semibold text-xs uppercase tracking-widest mb-8">
                <Calendar className="w-3.5 h-3.5 text-[#d97757]" />
                <span>年度末 研修予算消化枠</span>
              </div>
              
              <h1 className="text-[12vw] lg:text-[6.5rem] font-black tracking-tighter leading-[0.85] mb-8 text-balance">
                INSTALL<br />
                <span className="text-[#d97757]">AGENTS.</span>
              </h1>
              
              <div className="flex items-center gap-4 mb-10 bg-white/40 backdrop-blur-md w-fit p-3 rounded-2xl border border-white/20">
                <img src={CLAUDE_ICON} alt="Claude" className="w-10 h-10 object-contain" />
                <span className="text-xl font-light text-[#141413]/30">×</span>
                <img src={CLAUDE_CODE_LOGO} alt="Claude Code" className="h-8 object-contain" />
              </div>

              <p className="text-lg md:text-xl text-[#141413]/70 max-w-xl mb-12 leading-relaxed font-medium text-balance">
                単なる「生成AIの活用」から一歩先へ。Claude Codeを用いた実践的なワークショップを通じて、自律型AIエージェントを実務で活用するためのコアスキルを1〜2日間で組織にインストールします。
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="text-lg w-full sm:w-auto px-10">
                  詳細を見る <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2 mt-8 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <TerminalWindow />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Target Section - Bento Grid */}
      <section className="py-32 px-6 lg:px-12 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 md:mb-24"
          >
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6">TARGET</h2>
            <p className="text-xl text-[#141413]/60 max-w-2xl font-medium">短期集中で実践的なスキルを身につけ、組織のAI活用レベルを根本から引き上げます。</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Bento 1: Large Image Card */}
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="md:col-span-2 rounded-[2rem] overflow-hidden relative group cursor-pointer"
            >
              <img src={IMG_TEAM} alt="Team" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141413]/90 via-[#141413]/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 md:p-10 text-[#e8e6dc]">
                <h3 className="text-2xl md:text-3xl font-bold mb-3">年度末の予算を有効活用</h3>
                <p className="text-white/70 max-w-md">余剰となった研修予算を活用し、来期に向けた強力な武器となるAIスキルを組織に定着させます。</p>
              </div>
            </motion.div>

            {/* Bento 2: Solid Color Card */}
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="bg-[#d97757] rounded-[2rem] p-8 md:p-10 text-white flex flex-col justify-between cursor-pointer"
            >
              <Terminal className="w-10 h-10 opacity-50" />
              <div>
                <h3 className="text-2xl font-bold mb-3">導入の壁を突破</h3>
                <p className="text-white/80">ChatGPTは使っているが、自律型エージェントの具体的な活用方法がわからない企業様へ。</p>
              </div>
            </motion.div>

            {/* Bento 3: Solid Dark Card */}
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="bg-[#141413] rounded-[2rem] p-8 md:p-10 text-[#e8e6dc] flex flex-col justify-between cursor-pointer"
            >
              <Code className="w-10 h-10 text-[#d97757]" />
              <div>
                <h3 className="text-2xl font-bold mb-3">実践的なアウトプット</h3>
                <p className="text-white/60">座学だけでなく、実際にアプリを作るワークショップを通じて実務直結のスキルを得ます。</p>
              </div>
            </motion.div>

            {/* Bento 4: Image Card */}
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="md:col-span-2 rounded-[2rem] overflow-hidden relative group cursor-pointer"
            >
              <img src={IMG_CODE} alt="Code" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141413]/90 via-[#141413]/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 md:p-10 text-[#e8e6dc]">
                <h3 className="text-2xl md:text-3xl font-bold mb-3">初期オンボーディングの効率化</h3>
                <p className="text-white/70 max-w-md">Claude Codeを導入したものの、社内への浸透や活用促進に課題があるチームを支援します。</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Curriculum Section - Sticky Scroll */}
      <section className="py-32 px-6 lg:px-12 bg-white/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
            
            {/* Sticky Left Panel */}
            <div className="lg:w-1/3 lg:sticky lg:top-32 h-fit">
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6">PROGRAM</h2>
              <p className="text-xl text-[#141413]/60 font-medium mb-8">1日3時間、短期集中でAIエージェントの基礎から応用までを網羅する実践的カリキュラム。</p>
              <div className="hidden lg:flex flex-col gap-4">
                <div className="h-px w-full bg-[#141413]/10"></div>
                <div className="flex items-center justify-between text-[#141413]/50 font-mono text-sm">
                  <span>DURATION</span>
                  <span>1-2 DAYS</span>
                </div>
                <div className="h-px w-full bg-[#141413]/10"></div>
                <div className="flex items-center justify-between text-[#141413]/50 font-mono text-sm">
                  <span>FORMAT</span>
                  <span>ONLINE / WORKSHOP</span>
                </div>
              </div>
            </div>

            {/* Scrolling Right Panel */}
            <div className="lg:w-2/3 space-y-24">
              {/* Day 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative"
              >
                <div className="text-[8rem] md:text-[12rem] font-black text-[#141413]/5 leading-none absolute -top-16 md:-top-24 -left-8 md:-left-12 pointer-events-none select-none">01</div>
                <div className="relative z-10">
                  <div className="mb-8 rounded-[2rem] overflow-hidden h-64 md:h-80 w-full">
                    <img src={IMG_DAY1} alt="Day 1" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">AIエージェント基礎と<br/>Claude Code体験</h3>
                  <p className="text-xl text-[#141413]/60 mb-10">生成AIの現在地を理解し、実際にClaude Codeを動かしてアプリケーションを作成する体験ワークショップ。</p>
                  
                  <div className="space-y-6">
                    {[
                      { icon: BookOpen, title: "生成AI活用の現在地", desc: "ChatGPT、Claude Code、Cursorの違い / いま世界で起こっていること / 「生成AI活用」の定義とレベル" },
                      { icon: Users, title: "組織・人材の理想像定義", desc: "「AIを活用できている人材・組織」とはどのような状態か、ディスカッションを通じて解像度を上げます。" },
                      { icon: Terminal, title: "Claude Code 体験ワークショップ", desc: "環境構築から始め、Webサイト作成、データベース連携を含む本格的なアプリ開発までを一気通貫で体験。" }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-6 p-6 rounded-3xl bg-white/60 border border-white hover:bg-white transition-colors">
                        <div className="bg-[#141413] p-4 rounded-2xl h-fit shrink-0 text-white">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xl mb-2">{item.title}</h4>
                          <p className="text-[#141413]/70 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Day 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative"
              >
                <div className="text-[8rem] md:text-[12rem] font-black text-[#141413]/5 leading-none absolute -top-16 md:-top-24 -left-8 md:-left-12 pointer-events-none select-none">02</div>
                <div className="relative z-10">
                  <div className="mb-8 rounded-[2rem] overflow-hidden h-64 md:h-80 w-full">
                    <img src={IMG_DAY2} alt="Day 2" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">AIエージェント応用と<br/>自社導入への落とし込み</h3>
                  <p className="text-xl text-[#141413]/60 mb-10">より高度な機能の活用方法を学び、自社の業務にどう組み込むかを具体的に設計します。</p>
                  
                  <div className="space-y-6">
                    {[
                      { icon: Shield, title: "AIエージェントリテラシー", desc: "最新動向 / 保守運用 / セキュリティ / 法律など、企業導入に不可欠な知識をインプットします。" },
                      { icon: Code, title: "Claude Code 高度活用", desc: "MCP（Model Context Protocol）の使い方 / Agent Skills / Sub Agentの活用法を学び、オリジナルアプリを開発。" },
                      { icon: Lightbulb, title: "自社導入プランニング", desc: "学んだAIエージェント技術を、自身の企業や業務でどのように活用できるか、具体的なアクションプランを検討。" }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-6 p-6 rounded-3xl bg-white/60 border border-white hover:bg-white transition-colors">
                        <div className="bg-[#d97757] p-4 rounded-2xl h-fit shrink-0 text-white">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xl mb-2">{item.title}</h4>
                          <p className="text-[#141413]/70 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Dark Mode */}
      <section className="py-32 px-6 lg:px-12 bg-[#141413] text-[#e8e6dc] relative overflow-hidden">
        {/* Abstract glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d97757] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6 text-white">INVESTMENT</h2>
            <p className="text-xl text-gray-400 font-medium">導入ハードルの低い価格設定で、確かなスキルを提供します。</p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="dark-glass-panel rounded-[3rem] p-8 md:p-16 max-w-5xl mx-auto"
          >
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10">
                <div>
                  <div className="text-sm text-[#d97757] mb-3 font-mono tracking-widest">TARGET</div>
                  <div className="text-3xl font-bold text-white">法人企業様</div>
                </div>
                <div className="h-px w-full bg-white/10"></div>
                <div>
                  <div className="text-sm text-[#d97757] mb-3 font-mono tracking-widest">FORMAT</div>
                  <div className="text-3xl font-bold text-white flex items-center gap-4">
                    <MonitorPlay className="w-8 h-8" /> オンライン（Zoom）
                  </div>
                  <p className="text-gray-400 mt-4 leading-relaxed">※講座形式での実施となります。進行中の質疑応答はZoomのコメントにて対応いたします。</p>
                </div>
                <div className="h-px w-full bg-white/10"></div>
                <div>
                  <div className="text-sm text-[#d97757] mb-3 font-mono tracking-widest">DURATION</div>
                  <div className="text-3xl font-bold text-white flex items-center gap-4">
                    <Clock className="w-8 h-8" /> 1日あたり 3時間
                  </div>
                  <p className="text-gray-400 mt-4 leading-relaxed">※1Dayプラン、または土日開催等の2Dayプランからお選びいただけます。</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#d97757] to-[#b35e42] rounded-[2.5rem] p-12 flex flex-col justify-center items-center text-center shadow-[0_20px_60px_rgba(217,119,87,0.3)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[60px]"></div>
                
                <div className="text-white/90 font-bold mb-6 tracking-widest font-mono text-sm">PRICE PER COMPANY</div>
                <div className="text-8xl font-black text-white mb-2 tracking-tighter">10<span className="text-4xl font-bold tracking-normal">万</span></div>
                <div className="text-white/80 font-medium mb-12 text-lg">円（税抜）/ 参加人数制限なし</div>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#141413] text-white hover:bg-black font-bold py-6 px-10 rounded-full transition-colors duration-300 w-full text-xl flex items-center justify-center gap-3"
                >
                  ご相談・お申し込み <ArrowRight className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#141413] text-gray-500 py-16 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-3 mb-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer">
            <img src={CLAUDE_ICON} alt="Logo" className="w-8 h-8" />
            <span className="font-bold text-2xl tracking-tight text-white">AI Core Skills</span>
          </div>
          <p className="text-sm font-mono tracking-widest">© {new Date().getFullYear()} AI CORE SKILLS WORKSHOP. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
