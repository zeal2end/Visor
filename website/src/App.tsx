import { motion } from 'framer-motion';
import { Terminal, Keyboard, Shield, Zap, Clock, Globe, Github } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-[#282828] p-6 rounded-xl border border-[#3c3836] shadow-xl"
  >
    <div className="w-12 h-12 bg-[#32302f] rounded-lg flex items-center justify-center mb-4 border border-[#504945]">
      <Icon className="text-[#8ec07c]" size={24} />
    </div>
    <h3 className="text-[#fbf1c7] text-xl font-bold mb-2">{title}</h3>
    <p className="text-[#a89984] leading-relaxed">{description}</p>
  </motion.div>
);

const Kbd = ({ keys, label }: { keys: string, label?: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="bg-[#3c3836] border-b-2 border-[#1d2021] text-[#ebdbb2] px-3 py-1.5 rounded-md font-mono text-sm shadow-md">
      {keys}
    </span>
    {label && <span className="text-[10px] text-[#a89984] uppercase tracking-wider">{label}</span>}
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-[#1d2021] text-[#ebdbb2] selection:bg-[#fabd2f] selection:text-[#1d2021]">
      {/* Navigation */}
      <nav className="border-b border-[#3c3836] py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 bg-[#1d2021]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#b8bb26] rounded flex items-center justify-center font-bold text-[#1d2021]">V</div>
          <span className="font-bold text-xl tracking-tight text-[#fbf1c7]">Visor</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://github.com/zeal2end/Visor" className="hover:text-[#b8bb26] transition-colors flex items-center gap-2">
            <Github size={20} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a href="#download" className="bg-[#b8bb26] text-[#1d2021] px-4 py-2 rounded font-bold hover:bg-[#d79921] transition-all">
            Download
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="py-20 px-6 md:px-12 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block bg-[#32302f] text-[#8ec07c] px-3 py-1 rounded-full text-sm font-mono mb-6 border border-[#504945]">
            v0.1.0 • Now with macOS Private APIs
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[#fbf1c7] mb-8 leading-[1.1]">
            Drop-down Productivity. <br />
            <span className="text-[#b8bb26]">Zero Flow Break.</span>
          </h1>
          <p className="text-xl text-[#a89984] max-w-2xl mx-auto mb-10">
            A keyboard-centric, Quake-style task manager that slides down when you need it and vanishes when you don't.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <div className="flex items-center gap-3 bg-[#282828] border border-[#3c3836] px-6 py-4 rounded-lg font-mono">
              <span className="text-[#a89984]">Summon:</span>
              <div className="flex gap-1">
                <kbd className="bg-[#3c3836] px-2 py-1 rounded border-b-2 border-[#1d2021] text-sm">Ctrl</kbd>
                <span className="text-[#a89984]">+</span>
                <kbd className="bg-[#3c3836] px-2 py-1 rounded border-b-2 border-[#1d2021] text-sm">~</kbd>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fake App Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative max-w-4xl mx-auto bg-[#282828] rounded-t-xl border-x border-t border-[#3c3836] shadow-2xl overflow-hidden"
        >
          <div className="bg-[#1d2021] h-8 flex items-center px-4 gap-1.5 border-b border-[#3c3836]">
            <div className="w-3 h-3 rounded-full bg-[#fb4934]" />
            <div className="w-3 h-3 rounded-full bg-[#fabd2f]" />
            <div className="w-3 h-3 rounded-full bg-[#b8bb26]" />
            <div className="ml-4 text-[10px] text-[#a89984] font-mono tracking-widest">VISOR OVERLAY ACTIVE</div>
          </div>
          <div className="p-8 text-left font-mono space-y-4 min-h-[300px]">
            <div className="flex items-center gap-3 text-[#b8bb26]">
              <span className="text-[#a89984] opacity-50">1</span>
              <span>{">"} inbox</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#a89984] opacity-50">2</span>
              <span className="bg-[#32302f] px-2 py-1 rounded border-l-4 border-[#b8bb26] flex-1">
                Refactor Tauri invoke handlers <span className="text-[#fabd2f] ml-4">!today</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#a89984]">
              <span className="text-[#a89984] opacity-50">3</span>
              <span className="ml-4 opacity-50 line-through">Draft blog post about Rust productivity</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#a89984] opacity-50">4</span>
              <span>Design system updates <span className="text-[#83a598] ml-4">@tomorrow</span></span>
            </div>
            <div className="absolute bottom-4 left-8 right-8 h-10 bg-[#32302f] border border-[#b8bb26]/30 flex items-center px-4 gap-2">
              <span className="text-[#b8bb26] font-bold">I</span>
              <span className="text-[#ebdbb2] animate-pulse">|</span>
              <span className="text-[#a89984] text-xs absolute right-4">ADD TASK MODE</span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Features */}
      <section className="py-24 bg-[#1d2021] px-6 md:px-12 border-t border-[#3c3836]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#fbf1c7] mb-4">Built for Keyboard Warriors.</h2>
            <p className="text-[#a89984]">No mice allowed in this zone.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Terminal}
              title="Quake-Style UI"
              description="Summon the visor with a global hotkey. It slides down over any application, and vanishes when you hit Esc."
            />
            <FeatureCard 
              icon={Shield}
              title="Local-First"
              description="Your data never leaves your machine. Stored in human-readable JSON at ~/.visor/data.json."
            />
            <FeatureCard 
              icon={Zap}
              title="Smart Syntax"
              description="Capture deadlines with !today, !friday, or schedule starts with @next week. Natural language, parsed locally."
            />
            <FeatureCard 
              icon={Clock}
              title="Focus Sessions"
              description="Integrated Pomodoro-style timers with system notifications to keep you on track."
            />
            <FeatureCard 
              icon={Keyboard}
              title="Vim Navigation"
              description="Browse projects and tasks with H, J, K, L. Complete tasks with Space. Archive with X."
            />
            <FeatureCard 
              icon={Globe}
              title="Built-in API"
              description="Local HTTP server on port 8745. Script your tasks, pipe logs, or build custom integrations."
            />
          </div>
        </div>
      </section>

      {/* Keymap */}
      <section className="py-24 bg-[#282828] px-6 md:px-12 border-y border-[#3c3836]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-[#fbf1c7] mb-12 text-center">Master the Keymap</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-12">
            <Kbd keys="J / K" label="Navigate Up/Down" />
            <Kbd keys="H / L" label="Back / Enter" />
            <Kbd keys="Space" label="Complete Task" />
            <Kbd keys="I" label="Add New Task" />
            <Kbd keys=">" label="Command Mode" />
            <Kbd keys="?" label="Fuzzy Search" />
            <Kbd keys=":" label="Journal Mode" />
            <Kbd keys="U" label="Undo Action" />
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="py-24 px-6 md:px-12 text-center">
        <h2 className="text-4xl font-black text-[#fbf1c7] mb-8">Ready to drop in?</h2>
        <p className="text-xl text-[#a89984] mb-12 max-w-xl mx-auto">
          Visor is currently in active development. Build from source to get the latest features.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <a href="https://github.com/zeal2end/Visor" className="flex items-center justify-center gap-3 bg-[#ebdbb2] text-[#1d2021] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#fbf1c7] transition-all">
            <Github size={24} />
            View Source on GitHub
          </a>
          <div className="flex items-center justify-center gap-3 bg-[#32302f] border border-[#504945] px-8 py-4 rounded-lg font-mono text-[#ebdbb2]">
            <span className="text-[#a89984]">$</span>
            git clone ...
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-[#3c3836] text-center text-[#665c54] font-mono text-sm">
        <p>© 2026 Quake Visor Team • Built with Tauri & Rust</p>
      </footer>
    </div>
  );
}

export default App;
