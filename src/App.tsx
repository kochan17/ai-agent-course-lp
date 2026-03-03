import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { CalendarBlank, Clock, MonitorPlay, Users, ArrowRight, BookOpen, Code, Lightbulb, Terminal, ShieldCheck, ArrowUpRight, CaretDown, CurrencyJpy } from '@phosphor-icons/react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

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
    <div className="w-full rounded-2xl overflow-hidden bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
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

// --- FAQ Accordion Component ---
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#141413]/10">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full py-8 flex justify-between items-center text-left cursor-pointer group"
      >
        <span className="text-xl font-bold text-[#141413] group-hover:text-[#d97757] transition-colors pr-8">{question}</span>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="shrink-0 bg-white rounded-full p-2 shadow-sm border border-[#141413]/5"
        >
          <CaretDown className="w-5 h-5 text-[#d97757]" weight="bold" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-lg text-[#141413]/70 leading-relaxed font-medium">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// --- End FAQ Component ---

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#141413]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl tracking-tight flex items-center gap-3 z-10">
          <img src={CLAUDE_ICON} alt="Logo" className="w-6 h-6" />
          <span className="hidden sm:inline text-white">2day Claude Codeコアスキル講座</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link to="/#problem" className="text-sm font-bold text-white/70 hover:text-white transition-colors">課題</Link>
          <Link to="/#target" className="text-sm font-bold text-white/70 hover:text-white transition-colors">対象</Link>
          <Link to="/#program" className="text-sm font-bold text-white/70 hover:text-white transition-colors">プログラム</Link>
          <Link to="/#pricing" className="text-sm font-bold text-white/70 hover:text-white transition-colors">料金</Link>
          <Link to="/#faq" className="text-sm font-bold text-white/70 hover:text-white transition-colors">FAQ</Link>
        </div>

        <Link to="/#pricing" className="relative group overflow-hidden bg-gradient-to-r from-[#d97757] to-[#e85d3a] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(217,119,87,0.4)] hover:shadow-[0_0_30px_rgba(217,119,87,0.6)] hover:scale-105 z-10">
          <span className="relative z-10 flex items-center gap-2">お問い合わせ <ArrowUpRight className="w-4 h-4" /></span>
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 skew-x-12"></div>
        </Link>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-[#141413] text-gray-500 py-16 px-6 text-center">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <Link to="/" className="flex items-center gap-3 mb-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer">
          <img src={CLAUDE_ICON} alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-2xl tracking-tight text-white">2day Claude Codeコアスキル講座</span>
        </Link>
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
          <Link to="/company" className="hover:text-white transition-colors">会社情報</Link>
          <Link to="/terms" className="hover:text-white transition-colors">利用規約</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
        </div>
        <p className="text-sm font-mono tracking-widest">© {new Date().getFullYear()} Co-design Company 合同会社. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
}

function Company() {
  return (
    <div className="min-h-screen bg-[#e8e6dc] text-[#141413] font-sans pt-32 pb-20 px-6 lg:px-12">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] p-8 md:p-12 shadow-sm">
        <h1 className="text-3xl font-bold mb-8 text-[#141413]">会社情報</h1>
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr className="border-b border-[#141413]/10">
              <th className="py-4 pr-4 font-bold w-32 align-top">会社名</th>
              <td className="py-4">Co-design Company 合同会社</td>
            </tr>
            <tr className="border-b border-[#141413]/10">
              <th className="py-4 pr-4 font-bold w-32 align-top">代表社員</th>
              <td className="py-4">渡邉一城 / 坂本智子 (共同代表)</td>
            </tr>
            <tr>
              <th className="py-4 pr-4 font-bold w-32 align-top">所在地</th>
              <td className="py-4">
                〒104-0061<br />
                東京都中央区銀座一丁目27番8号 セントラルビル703号
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Terms() {
  return (
    <div className="min-h-screen bg-[#e8e6dc] text-[#141413] font-sans pt-32 pb-20 px-6 lg:px-12">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] p-8 md:p-12 shadow-sm">
        <h1 className="text-3xl font-bold mb-8 text-[#141413]">利用規約</h1>
        <div className="space-y-6 text-[#141413]/80 leading-relaxed">
          <p>この利用規約（以下、「本規約」といいます。）は、Co-design Company 合同会社（以下、「当社」といいます。）が提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。</p>
          
          <h2 className="text-xl font-bold text-[#141413] mt-8">第1条（適用）</h2>
          <p>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
          
          <h2 className="text-xl font-bold text-[#141413] mt-8">第2条（利用登録）</h2>
          <p>登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</p>
          
          <h2 className="text-xl font-bold text-[#141413] mt-8">第3条（禁止事項）</h2>
          <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
            <li>当社のサービスの運営を妨害するおそれのある行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>不正アクセスをし、またはこれを試みる行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Privacy() {
  return (
    <div className="min-h-screen bg-[#e8e6dc] text-[#141413] font-sans pt-32 pb-20 px-6 lg:px-12">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] p-8 md:p-12 shadow-sm">
        <h1 className="text-3xl font-bold mb-8 text-[#141413]">プライバシーポリシー</h1>
        <div className="space-y-6 text-[#141413]/80 leading-relaxed">
          <p>Co-design Company 合同会社（以下、「当社」といいます。）は、本ウェブサイト上で提供するサービス（以下、「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。</p>
          
          <h2 className="text-xl font-bold text-[#141413] mt-8">第1条（個人情報）</h2>
          <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
          
          <h2 className="text-xl font-bold text-[#141413] mt-8">第2条（個人情報の収集方法）</h2>
          <p>当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下、｢提携先｣といいます。）などから収集することがあります。</p>
          
          <h2 className="text-xl font-bold text-[#141413] mt-8">第3条（個人情報を収集・利用する目的）</h2>
          <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>当社サービスの提供・運営のため</li>
            <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
            <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
            <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
            <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
            <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
            <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
            <li>上記の利用目的に付随する目的</li>
          </ol>
          
          <h2 className="text-xl font-bold text-[#141413] mt-8">第4条（お問い合わせ窓口）</h2>
          <p>本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。</p>
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p>住所：〒104-0061 東京都中央区銀座一丁目27番8号 セントラルビル703号</p>
            <p>社名：Co-design Company 合同会社</p>
            <p>代表社員：渡邉一城 / 坂本智子</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-[#e8e6dc] text-[#141413] font-sans selection:bg-[#d97757] selection:text-white">
      {/* Hero Section - 2026 Modern Split/Overlap */}
      <section className="relative min-h-[100svh] flex items-center pt-20 overflow-hidden hero-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="w-full lg:w-1/2 pt-20 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="border-l-4 border-[#d97757] pl-6 md:pl-8"
            >
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white font-semibold text-sm tracking-widest">
                  <Users className="w-4 h-4" />
                  <span>対象：法人向け</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white font-semibold text-sm tracking-widest">
                  <MonitorPlay className="w-4 h-4" />
                  <span>形式：オンライン</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white font-semibold text-sm tracking-widest">
                  <Clock className="w-4 h-4" />
                  <span>講座時間：3時間 × 2日</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white font-semibold text-sm tracking-widest">
                  <CurrencyJpy className="w-4 h-4" />
                  <span>料金：10万円/社</span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-8 text-balance text-white">
                <img src={CLAUDE_CODE_LOGO} alt="Claude Code" className="h-12 md:h-16 lg:h-20 mb-4 object-contain" />
                コアスキル講座
              </h1>
              
              <Link to="/#pricing">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden flex items-center gap-3 mb-10 bg-gradient-to-r from-[#d97757] to-[#e85d3a] text-white w-fit py-4 px-10 rounded-full transition-all duration-300 group cursor-pointer shadow-[0_0_40px_rgba(217,119,87,0.4)] hover:shadow-[0_0_60px_rgba(217,119,87,0.6)]"
                >
                  <span className="relative z-10 font-bold text-lg flex items-center gap-2">
                    詳細を見る <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 skew-x-12"></div>
                </motion.button>
              </Link>

              <p className="text-lg md:text-xl text-white/90 mb-12 leading-relaxed font-medium">
                単なる「生成AIの活用」から一歩先へ。Claude Codeを用いた実践的なワークショップを通じて、自律型AIエージェントを実務で活用するためのコアスキルを解説します。
              </p>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2 mt-8 lg:mt-0 relative z-20">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:w-[130%] lg:max-w-[800px]"
            >
              <TerminalWindow />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-32 px-6 lg:px-12 bg-[#f9f8f6] relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 md:mb-24 text-center"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-6 text-[#141413]">
              AIは導入した。<br className="hidden md:block" />でも、「検索」止まりになっていませんか。
            </h2>
            <p className="text-xl text-[#141413]/60 font-medium">
              こんな状況に、心当たりはありませんか。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Issue 01 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[#141413]/5"
            >
              <div className="text-[#d97757] font-mono font-bold tracking-widest mb-4">ISSUE 01</div>
              <h3 className="text-xl font-bold mb-4 text-[#141413]">AIツールを導入したのに、使い方が「検索」と「文章の要約」だけ</h3>
              <p className="text-[#141413]/70 leading-relaxed">
                ChatGPTやCopilotのライセンスを全社に配布した。でも社員がやっていることは、Google検索の代わりに質問を投げるだけ。月額料金に見合う成果が出ているのか、正直わからない。
              </p>
            </motion.div>

            {/* Issue 02 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[#141413]/5"
            >
              <div className="text-[#d97757] font-mono font-bold tracking-widest mb-4">ISSUE 02</div>
              <h3 className="text-xl font-bold mb-4 text-[#141413]">「AIで何ができるか」の判断を、現場任せにしてしまっている</h3>
              <p className="text-[#141413]/70 leading-relaxed">
                現場に「AIを使って効率化してほしい」と号令をかけたものの、具体的に何をどう変えるかは各部署任せ。結果、誰も本気で取り組まない。
              </p>
            </motion.div>

            {/* Issue 03 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[#141413]/5"
            >
              <div className="text-[#d97757] font-mono font-bold tracking-widest mb-4">ISSUE 03</div>
              <h3 className="text-xl font-bold mb-4 text-[#141413]">外部のAIセミナーに参加しても、自社でどう使うかが見えない</h3>
              <p className="text-[#141413]/70 leading-relaxed">
                一般的な「AIトレンド講演」や「プロンプト入門」は聞いた。でも「うちの会社でどう使えばいいか」がいまだにわからない。
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Issue Section */}
      <section className="py-24 px-6 lg:px-12 bg-[#141413] text-[#e8e6dc]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <p className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
              これらの問題の根っこは、一つです。<br />
              <span className="text-[#d97757]">「今のAIの本当の実力」を体感レベルで理解していない。</span>
            </p>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed font-medium text-balance">
              2024年後半から、AIは「チャットで質問に答えるツール」から「指示すれば自分でコードを書き、アプリを作り、業務を自動化するエージェント」へと変わりました。しかし、この変化の大きさを肌で感じているビジネスパーソンはまだ少数です。知らないものに対して、的確な投資判断は難しいです。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Target Section - Z-Pattern Layout */}
      <section id="target" className="py-40 px-6 lg:px-12 relative bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-24 md:mb-32 text-center"
          >
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6 text-[#141413]">TARGET</h2>
            <p className="text-xl text-[#141413]/60 max-w-2xl mx-auto font-medium">短期集中で実践的なスキルを身につけ、組織のAI活用レベルを根本から引き上げます。</p>
          </motion.div>

          <div className="space-y-32 md:space-y-48">
            {/* Block 1: Image Left, Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="w-full md:w-1/2"
              >
                <div className="rounded-[2rem] overflow-hidden aspect-[4/3] shadow-2xl shadow-[#141413]/10">
                  <img src={IMG_TEAM} alt="Team collaboration" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="w-full md:w-1/2"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d97757]/10 text-[#d97757] mb-8">
                  <Terminal className="w-8 h-8" weight="duotone" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6 text-[#141413] leading-tight">
                  導入の壁を突破し、<br />自律型エージェントを使いこなす
                </h3>
                <p className="text-xl text-[#141413]/70 leading-relaxed font-medium">
                  「ChatGPTは使っているが、Claude Codeのような自律型エージェントの具体的な活用方法がわからない」という企業様へ。環境構築から実務でのプロンプト設計まで、つまずきやすいポイントを丁寧に解説します。
                </p>
              </motion.div>
            </div>

            {/* Block 2: Text Left, Image Right */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="w-full md:w-1/2"
              >
                <div className="rounded-[2rem] overflow-hidden aspect-[4/3] shadow-2xl shadow-[#141413]/10">
                  <img src={IMG_CODE} alt="Practical coding" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="w-full md:w-1/2"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d97757]/10 text-[#d97757] mb-8">
                  <Code className="w-8 h-8" weight="duotone" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6 text-[#141413] leading-tight">
                  座学で終わらせない、<br />実践的なアウトプット
                </h3>
                <p className="text-xl text-[#141413]/70 leading-relaxed font-medium">
                  単なる機能説明のセミナーではありません。実際に手を動かしてアプリケーションを作るワークショップを通じて、翌日から実務で使える「生きたスキル」を身につけます。
                </p>
              </motion.div>
            </div>

            {/* Block 3: Image Left, Text Right */}
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="w-full md:w-1/2"
              >
                <div className="rounded-[2rem] overflow-hidden aspect-[4/3] shadow-2xl shadow-[#141413]/10">
                  <img src={IMG_DAY2} alt="Onboarding" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="w-full md:w-1/2"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d97757]/10 text-[#d97757] mb-8">
                  <Users className="w-8 h-8" weight="duotone" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6 text-[#141413] leading-tight">
                  初期オンボーディングの<br />圧倒的な効率化
                </h3>
                <p className="text-xl text-[#141413]/70 leading-relaxed font-medium">
                  「AIツールを導入したものの、社内への浸透や活用促進に課題がある」というチームを支援します。共通の言語と成功体験を持つことで、組織全体のAI活用スピードが加速します。
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Section - Sticky Scroll */}
      <section id="program" className="py-32 px-6 lg:px-12 bg-white/40">
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
                      { icon: ShieldCheck, title: "AIエージェントリテラシー", desc: "最新動向 / 保守運用 / セキュリティ / 法律など、企業導入に不可欠な知識をインプットします。" },
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
      <section id="pricing" className="py-40 px-6 lg:px-12 bg-[#141413] text-[#e8e6dc] relative overflow-hidden">
        {/* Abstract glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d97757] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6 text-white">料金</h2>
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
                  <div className="text-sm text-[#d97757] mb-3 font-bold tracking-widest">対象</div>
                  <div className="text-3xl font-bold text-white">法人企業様</div>
                </div>
                <div className="h-px w-full bg-white/10"></div>
                <div>
                  <div className="text-sm text-[#d97757] mb-3 font-bold tracking-widest">形式</div>
                  <div className="text-3xl font-bold text-white flex items-center gap-4">
                    <MonitorPlay className="w-8 h-8" /> オンライン（Zoom）
                  </div>
                  <p className="text-gray-400 mt-4 leading-relaxed">※講座形式での実施となります。進行中の質疑応答はZoomのコメントにて対応いたします。</p>
                </div>
                <div className="h-px w-full bg-white/10"></div>
                <div>
                  <div className="text-sm text-[#d97757] mb-3 font-bold tracking-widest">講義時間</div>
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

      {/* FAQ Section */}
      <section id="faq" className="py-40 px-6 lg:px-12 bg-white relative">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 md:mb-24 text-center"
          >
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6 text-[#141413]">FAQ</h2>
            <p className="text-xl text-[#141413]/60 font-medium">よくあるご質問</p>
          </motion.div>

          <div className="border-t border-[#141413]/10">
            <FAQItem 
              question="講座では具体的にどのようなアプリを作りますか？" 
              answer="Claude Codeを用いて、売上ダッシュボードや社内ツールなどの実践的なWebアプリケーションをゼロから構築します。要件定義からコーディング、デプロイまでのプロセスをAIエージェントと対話しながら進める体験をしていただきます。" 
            />
            <FAQItem 
              question="エンジニアではないビジネス職（企画・営業など）でも参加できますか？" 
              answer="はい、ご参加いただけます。本講座はプログラミング未経験の方でも、AIエージェントを使って業務効率化ツールを作成できるようになることを目指しています。専門用語は極力使わず、直感的に理解できるカリキュラムをご用意しています。" 
            />
            <FAQItem 
              question="事前に準備するものはありますか？" 
              answer="インターネットに接続できるPC（Windows/Mac）と、Claude（Anthropic）のアカウントをご用意ください。Claude Codeのインストール等の環境構築は、ワークショップの冒頭で一緒に行いますのでご安心ください。" 
            />
            <FAQItem 
              question="参加人数によって料金は変わりますか？" 
              answer="いいえ、変わりません。1社あたり10万円（税抜）の定額制となっており、何名様でもご参加いただけます。社内での共通言語を作るためにも、部署全体やプロジェクトチーム単位でのご受講を強くおすすめしております。" 
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/company" element={<Company />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
