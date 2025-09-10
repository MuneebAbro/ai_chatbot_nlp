// Clean version of chatbot-widget.js (theming removed)
(function() {
    'use strict';

    class ChatbotWidget {
        constructor(config = {}) {
            this.apiUrl = config.apiUrl || 'https://bitpack-widget.vercel.app/api';
            this.businessId = config.businessId || 'default';
            this.color = config.color || '#111827';
            this.secondary = config.secondary || '#ffffff';
            this.sessionId = `widget_${this.businessId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.init();
        }

        init() {
            this.createStyles();
            this.createWidget();
            this.attachEvents();
            this.applyTheme(this.color, this.secondary);
            this.loadInitialMessage();
            this.setupMobileOptimizations();
        }

        createStyles() {
    const styles = `
        /* CSS Isolation for Widget - Protect against external interference */
        #chatbot-widget, #chatbot-widget * {
            box-sizing: border-box !important;
        }
        
        /* Protect input field from external CSS interference */
        #chatbot-input {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            border-radius: 20px !important;
            font-size: 14px !important;
            color: #333333 !important;
            background: #ffffff !important;
            border: 1px solid #ccc !important;
            padding: 10px 12px !important;
            height: 40px !important;
            min-height: 40px !important;
            max-height: 40px !important;
            line-height: 1.4 !important;
            font-weight: normal !important;
            text-decoration: none !important;
            outline: none !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            width: auto !important;
            min-width: 0 !important;
            max-width: none !important;
            display: block !important;
            position: static !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            z-index: auto !important;
            overflow: visible !important;
            text-align: left !important;
            text-transform: none !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
            text-indent: 0 !important;
            text-shadow: none !important;
            box-shadow: none !important;
            transition: none !important;
            transform: none !important;
            filter: none !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        /* Protect mobile input from external CSS */
        @media (max-width: 768px) {
            #chatbot-input {
                font-size: 16px !important; /* Prevents zoom on iOS */
                height: 44px !important;
                min-height: 44px !important;
                max-height: 44px !important;
                padding: 12px 16px !important;
                color: #333333 !important;
                background: #ffffff !important;
                border: 1px solid #ccc !important;
                border-radius: 20px !important;
                margin: 0 !important;
            }
        }
        
        /* Protect input area container from external CSS */
        #chatbot-input-area {
            padding: 10px !important;
            border-top: 1px solid #ddd !important;
            display: flex !important;
            gap: 8px !important;
            background: #fff !important;
            align-items: center !important;
            margin: 0 !important;
            border: 0 !important;
            border-top: 1px solid #ddd !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            box-sizing: border-box !important;
        }
        
        /* Protect suggestion container and chips from external CSS */
        #chatbot-suggestions {
            display: flex !important;
            padding: 12px 16px !important;
            border-top: 1px solid #e5e7eb !important;
            background: #fff !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            white-space: nowrap !important;
            scroll-behavior: smooth !important;
            gap: 8px !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
        }
        
        #chatbot-suggestions::-webkit-scrollbar {
            display: none !important;
        }
        
        .chip {
            background: var(--c-primary) !important;
            color: var(--c-secondary) !important;
            border: none !important;
            border-radius: 9999px !important;
            padding: 8px 16px !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            height: 36px !important;
            min-height: 36px !important;
            max-height: 36px !important;
            line-height: 1.2 !important;
            touch-action: manipulation !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            transition: all 0.2s ease !important;
            white-space: nowrap !important;
            margin: 0 8px 0 0 !important;
            flex-shrink: 0 !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            text-decoration: none !important;
            outline: none !important;
            box-sizing: border-box !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: auto !important;
            min-width: auto !important;
            max-width: none !important;
        }
        
        .chip:hover {
            background: var(--c-primary-2) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
        
        .chip:active {
            transform: translateY(0) !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        /* Mobile suggestion adjustments */
        @media (max-width: 768px) {
            #chatbot-suggestions {
                padding: 12px !important;
                gap: 10px !important;
            }
            .chip {
                padding: 8px 12px !important;
                font-size: 14px !important;
                height: 36px !important;
                min-height: 36px !important;
                max-height: 36px !important;
                line-height: 1.2 !important;
            }
        }
        
        :root { 
            --c-primary:#000000; 
            --c-secondary:#ffffff; 
            --c-bg:#f9fafb; 
            --c-bot:#f3f4f6; 
            --c-bot-text:#111827; 
        }
            #chatbot-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 64px;
    height: 64px;
    background: var(--c-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 20px rgba(0,0,0,0.25);
    transition: transform .2s ease, opacity .2s ease, background .2s ease;
    color: #fff;
    z-index: 9998;
    touch-action: manipulation;
}
#chatbot-toggle.hide {
    opacity: 0;
    pointer-events: none;
    transform: scale(.9);
}

        #chatbot-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 90vw;
            max-width: 380px;
            min-width: 300px;
            height: 80vh;
            max-height: 640px;
            min-height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            display: none;
            flex-direction: column;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            overflow: hidden;
            transition: transform .25s ease, opacity .25s ease;
            opacity: 0;
            transform: translateY(12px) scale(.98);
            z-index: 9999;
        }
        
        #chatbot-widget.show {
            display: flex !important;
            opacity: 1 !important;
            transform: translateY(0) scale(1) !important;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            #chatbot-widget {
                width: calc(100vw - 40px);
                height: calc(100vh - 40px);
                max-width: none;
                max-height: none;
                bottom: 0;
                right: 0;
                left: 0;
                top: 0;
                border-radius: 0;
                position: fixed;
            }
            
            #chatbot-toggle {
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
            }
        }

        /* Tablet responsiveness */
        @media (min-width: 769px) and (max-width: 1024px) {
            #chatbot-widget {
                width: 400px;
                height: 70vh;
                max-height: 600px;
                bottom: 20px;
                right: 20px;
            }
        }

        /* Small mobile devices */
        @media (max-width: 480px) {
            #chatbot-widget {
                width: calc(100vw - 20px);
                height: calc(100vh - 20px);
                bottom: 10px;
                right: 10px;
                left: 10px;
                border-radius: 12px;
            }
            
            #chatbot-toggle {
                bottom: 15px;
                right: 15px;
                width: 52px;
                height: 52px;
            }
        }
        #chatbot-header {
            background: var(--c-primary);
            color: var(--c-secondary);
            padding: 14px;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
             #chatbot-messages {
                    flex: 1;
                    padding: 12px;
                    overflow-y: auto;
                    background: var(--c-bg);
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                    .chatbot-actions {
    display: flex;
    gap: 6px;
}
        #chatbot-header .brand {
            display: flex;
            gap: 10px;
            align-items: center;
            font-size: 15px;
        }
        .brand-logo {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #000000;
            color: #ffffff;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        #chatbot-messages {
            flex: 1;
            padding: 14px;
            overflow-y: auto;
            background: var(--c-bg);
            display: flex;
            flex-direction: column;
            gap: 8px;
            scroll-behavior: smooth;
        }
        .chatbot-msg {
            display: inline-block;
            padding: 10px 14px;
            border-radius: 18px;
            max-width: 85%;
            word-wrap: break-word;
            font-size: 14px;
            line-height: 1.6;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .chatbot-msg.show {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        /* Mobile message adjustments */
        @media (max-width: 768px) {
            .chatbot-msg {
                max-width: 90%;
                padding: 12px 16px;
                font-size: 15px;
            }
        }
        .chatbot-msg.user {
            background: var(--c-primary);
            color: #ffffff;
            align-self: flex-end;
            border-radius: 18px 18px 4px 18px;
        }
        .chatbot-msg.bot {
            background: var(--c-bot);
            color: var(--c-bot-text);
            align-self: flex-start;
            border-radius: 18px 4px 18px 18px;
        }
        
        .chatbot-msg strong {
            font-weight: 600;
        }
        
        .chatbot-msg em {
            font-style: italic;
        }
        
        .chatbot-msg code {
            background: rgba(0,0,0,0.1);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        .chatbot-msg h1 {
            font-size: 1.4em;
            font-weight: 600;
            margin: 8px 0 4px 0;
            color: var(--c-bot-text);
        }
        
        .chatbot-msg h2 {
            font-size: 1.2em;
            font-weight: 600;
            margin: 6px 0 3px 0;
            color: var(--c-bot-text);
        }
        
        .chatbot-msg h3 {
            font-size: 1.1em;
            font-weight: 600;
            margin: 5px 0 3px 0;
            color: var(--c-bot-text);
        }
        
        .chatbot-msg ul {
            margin: 4px 0;
            padding-left: 20px;
        }
        
        .chatbot-msg li {
            margin: 2px 0;
            line-height: 1.4;
        }

        .chatbot-msg-timestamp {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 2px;
            opacity: 0.8;
        }

        .chatbot-msg.user .chatbot-msg-timestamp {
            text-align: right;
            margin-right: 8px;
        }

        .chatbot-msg.bot .chatbot-msg-timestamp {
            text-align: left;
            margin-left: 8px;
        }

        /* Typing indicator */
        .chatbot-typing {
            display: inline-block;
            padding: 10px 14px;
            margin: 4px 8px;
            border-radius: 18px 4px 18px 18px;
            background: var(--c-bot);
            color: var(--c-bot-text);
            align-self: flex-start;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chatbot-typing.show {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .chatbot-typing-dots {
            display: flex;
            gap: 4px;
            align-items: center;
        }

        .chatbot-typing-dot {
            width: 6px;
            height: 6px;
            background: #9ca3af;
            border-radius: 50%;
            animation: typing-bounce 1.4s infinite ease-in-out;
        }

        .chatbot-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .chatbot-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing-bounce {
            0%, 80%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }
            .chatbot-close-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            color: var(--c-secondary);
        }
        
        .chatbot-close-btn:hover {
            background: rgba(255,255,255,0.15);
            transform: scale(1.1);
        }
        
        .chatbot-close-btn svg {
            transition: transform 0.2s ease;
        }
        #chatbot-input-area {
            padding: 10px;
            border-top: 1px solid #ddd;
            display: flex;
            gap: 8px;
            background: #fff;
            align-items: center;
        }

        /* Mobile input adjustments */
        @media (max-width: 768px) {
            #chatbot-input-area {
                padding: 12px;
                gap: 10px;
            }
        }
            #chatbot-suggestions { 
                display: none; 
                padding: 12px 16px; 
                border-top: 1px solid #e5e7eb; 
                background: #fff; 
                overflow-x: auto;
                overflow-y: hidden;
                scrollbar-width: none;
                -ms-overflow-style: none;
                white-space: nowrap;
                scroll-behavior: smooth;
            }
            
            #chatbot-suggestions::-webkit-scrollbar {
                display: none;
            }
            
            /* Enable horizontal scrolling on desktop */
            #chatbot-suggestions {
                -webkit-overflow-scrolling: touch;
                scroll-snap-type: x mandatory;
            }
            
            .chip { 
                background: var(--c-primary);
                color: var(--c-secondary);
                border: none;
                border-radius: 9999px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                min-height: 36px;
                touch-action: manipulation;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                white-space: nowrap;
                margin-right: 8px;
                flex-shrink: 0;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }
            .chip:hover { 
                background: var(--c-primary-2);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            .chip:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            /* Mobile suggestions adjustments */
            @media (max-width: 768px) {
                #chatbot-suggestions {
                    padding: 12px;
                    gap: 10px;
                }
                .chip {
                    padding: 8px 12px;
                    font-size: 14px;
                    min-height: 36px;
                }
            }
        #chatbot-input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #ccc;
            border-radius: 20px;
            outline: none;
            font-size: 14px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            min-height: 40px;
            resize: none;
            background: #ffffff;
            color: #333333;
            line-height: 1.4;
            font-weight: normal;
            text-decoration: none;
            box-sizing: border-box;
            margin: 0;
        }

        /* Mobile input field adjustments */
        @media (max-width: 768px) {
            #chatbot-input {
                padding: 12px 16px;
                font-size: 16px; /* Prevents zoom on iOS */
                min-height: 44px;
            }
        }
        #chatbot-send {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            min-height: 44px;
            touch-action: manipulation;
        }

        /* Mobile send button adjustments */
        @media (max-width: 768px) {
            #chatbot-send {
                padding: 10px;
                min-width: 48px;
                min-height: 48px;
            }
        }
        #chatbot-send svg {
            width: 20px;
            height: 20px;
            stroke: #000000;
            transition: transform 0.2s ease;
        }
        
        #chatbot-send:hover svg {
            transform: scale(1.1);
        }
        
        .chatbot-icon-btn svg {
            transition: transform 0.2s ease;
        }
        
        .chatbot-icon-btn:hover svg {
            transform: scale(1.1);
        }

        /* Scroll to bottom button */
        #chatbot-scroll-bottom {
            position: fixed;
            bottom: 150px;
            right: 18px;
            width: 36px;
            height: 36px;
            background: #f6f6f6;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        #chatbot-scroll-bottom:hover {
            background: #d9d9d9;
            transform: scale(1.05);
        }

        #chatbot-scroll-bottom svg {
            width: 16px;
            height: 16px;
            stroke: #374151;
            stroke-width: 2.5;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        /* Mobile adjustments for scroll button */
        @media (max-width: 768px) {
            #chatbot-scroll-bottom {
                bottom: 90px;
                right: 10px;
                width: 40px;
                height: 40px;
            }
            
            #chatbot-scroll-bottom svg {
                width: 18px;
                height: 18px;
            }
        }
    `;
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    styleTag.setAttribute('data-chatbot-widget', 'true');
    document.head.appendChild(styleTag);
}

               createWidget() {
    // Default business name - will be updated when we fetch from API
    let businessName = "AI Agent"; // default fallback

    const html = `
        <div id="chatbot-widget">
            <div id="chatbot-header">
                <div class="brand">
    <div class="brand-logo">${businessName.charAt(0).toUpperCase()}</div>
    <span id="chatbot-business-name">Chat with ${businessName}</span>
</div>

                <div class="chatbot-actions">
                    <button id="chatbot-close" class="chatbot-close-btn" title="Close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6L6 18"/>
                            <path d="M6 6L18 18"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="chatbot-messages"></div>
            <button id="chatbot-scroll-bottom" title="Scroll to bottom">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 13l5 5 5-5"/>
                    <path d="M7 6l5 5 5-5"/>
                </svg>
            </button>
            <div id="chatbot-suggestions"></div>
            <div id="chatbot-input-area">
                <input id="chatbot-input" type="text" placeholder="Type your message..." />
                <button id="chatbot-send">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                    </svg>
                </button>
            </div>
        </div>
        <div id="chatbot-toggle" title="Chat with us">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve" width="32" height="32">
                <g>
                    <path d="M14 48.3C14 59.7 23.3 69 34.7 69c1.3 0 2.3 1.3 2 2.6 -0.8 3 -2.1 6.3 -4 9 -1 1.4 0.1 3.4 1.8 3.2 7.2 -0.7 19.5 -3.4 22.7 -13.4 0.3 -0.8 1 -1.4 1.9 -1.4h8.2C78.7 69 88 59.7 88 48.3v-7.6C88 29.3 78.7 20 67.3 20H34.7C23.3 20 14 29.3 14 40.7z" fill="currentColor"/>
                </g>
            </svg>
        </div>
    `;
    
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);

    this.elements = {
        widget: document.getElementById('chatbot-widget'),
        toggle: document.getElementById('chatbot-toggle'),
        messages: document.getElementById('chatbot-messages'),
        input: document.getElementById('chatbot-input'),
        send: document.getElementById('chatbot-send'),
        close: document.getElementById('chatbot-close'),
        businessName: document.getElementById('chatbot-business-name'),
        brandLogo: document.querySelector('.brand-logo'),
        scrollBottom: document.getElementById('chatbot-scroll-bottom')
    };
}


        attachEvents() {
            this.elements.toggle.onclick = () => {
                this.elements.widget.classList.add('show');
                this.elements.toggle.classList.add('hide');
            };
            this.elements.send.onclick = () => this.sendMessage();
            this.elements.input.onkeypress = (e) => {
                if (e.key === 'Enter') this.sendMessage();
            };
            this.elements.close.onclick = () => this.closeWidget();
            this.elements.scrollBottom.onclick = () => this.scrollToBottom();
            
            // Initialize missing elements
            this.elements.messages = document.getElementById('chatbot-messages');
            this.elements.suggestions = document.getElementById('chatbot-suggestions');
            
            // Add scroll event listener to messages container
            this.elements.messages.addEventListener('scroll', () => this.handleScroll());
            
            // Add horizontal scroll support for suggestions on desktop
            if (this.elements.suggestions) {
                this.elements.suggestions.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    this.elements.suggestions.scrollLeft += e.deltaY;
                });
            }
        }

        closeWidget() {
            this.elements.widget.classList.remove('show');
            setTimeout(() => { 
                this.elements.toggle.classList.remove('hide'); 
                // Only restore body scroll on mobile devices
                if (window.innerWidth <= 768) {
                    document.body.style.overflow = ''; // Restore body scroll
                }
            }, 150);
        }

        handleScroll() {
            const messages = this.elements.messages;
            const scrollBottom = this.elements.scrollBottom;
            
            if (!messages || !scrollBottom) return;
            
            const isScrolledUp = messages.scrollTop < (messages.scrollHeight - messages.clientHeight - 50);
            
            if (isScrolledUp) {
                scrollBottom.style.display = 'flex';
            } else {
                scrollBottom.style.display = 'none';
            }
        }

        scrollToBottom() {
            const messages = this.elements.messages;
            if (messages) {
                messages.scrollTo({
                    top: messages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }

        showTypingIndicator() {
            const typing = document.createElement('div');
            typing.className = 'chatbot-typing';
            typing.innerHTML = `
                <div class="chatbot-typing-dots">
                    <div class="chatbot-typing-dot"></div>
                    <div class="chatbot-typing-dot"></div>
                    <div class="chatbot-typing-dot"></div>
                </div>
            `;
            
            this.elements.messages.appendChild(typing);
            
            // Trigger animation
            requestAnimationFrame(() => {
                typing.classList.add('show');
            });
            
            // Scroll to bottom
            setTimeout(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                this.handleScroll();
            }, 50);
            
            return typing;
        }

        hideTypingIndicator(typingElement) {
            if (typingElement && typingElement.parentNode) {
                typingElement.classList.remove('show');
                setTimeout(() => {
                    if (typingElement.parentNode) {
                        typingElement.parentNode.removeChild(typingElement);
                    }
                }, 300);
            }
        }

        appendMessage(text, sender = 'bot') {
            // Create message container
            const msgContainer = document.createElement('div');
            msgContainer.style.display = 'flex';
            msgContainer.style.flexDirection = 'column';
            msgContainer.style.alignItems = sender === 'user' ? 'flex-end' : 'flex-start';
            msgContainer.style.margin = '4px 8px';
            
            // Create message bubble
            const msg = document.createElement('div');
            msg.className = `chatbot-msg ${sender}`;
            
            // Create message content
            const msgContent = document.createElement('div');
            if (sender === 'bot') {
                msgContent.innerHTML = this.parseMarkdown(text);
            } else {
                msgContent.textContent = text;
            }
            msg.appendChild(msgContent);
            
            // Add message bubble to container
            msgContainer.appendChild(msg);
            
            // Add timestamp outside the bubble
            const timestamp = document.createElement('div');
            timestamp.className = 'chatbot-msg-timestamp';
            timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            msgContainer.appendChild(timestamp);
            
            this.elements.messages.appendChild(msgContainer);
            
            // Trigger the slide-up animation
            requestAnimationFrame(() => {
                msg.classList.add('show');
            });
            
            // Smooth scroll to bottom
            setTimeout(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                this.handleScroll(); // Update scroll button visibility
            }, 50);
        }
        
        parseMarkdown(text) {
            return text
                // Headings: # Heading, ## Heading, ### Heading
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                // Bold text: **text** or __text__
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.*?)__/g, '<strong>$1</strong>')
                // Italic text: *text* or _text_
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
                // Code: `code`
                .replace(/`(.*?)`/g, '<code>$1</code>')
                // Lists: - item or * item
                .replace(/^[\s]*[-*] (.*$)/gim, '<li>$1</li>')
                // Numbered lists: 1. item, 2. item
                .replace(/^[\s]*\d+\. (.*$)/gim, '<li>$1</li>')
                // Wrap consecutive list items in <ul> tags
                .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
                // Clean up multiple <ul> tags
                .replace(/<\/ul>\s*<ul>/g, '')
                // Line breaks
                .replace(/\n/g, '<br>');
        }

        async loadInitialMessage() {
            try {
                const res = await fetch(`${this.apiUrl}/initial-message?business=${this.businessId}`);
                const data = await res.json();
                
                // Update business name and logo if available
                if (data.business_name) {
                    this.updateBusinessName(data.business_name, data.business_logo);
                }
                
                this.appendMessage(data.message || 'Hello! How can I help you today?');
                if (Array.isArray(data.suggestions) && data.suggestions.length) {
                    this.renderSuggestions(data.suggestions);
                }
            } catch (err) {
                this.appendMessage('Welcome!');
            }
        }

        async sendMessage() {
            const text = this.elements.input.value.trim();
            if (!text) return;
            this.appendMessage(text, 'user');
            this.elements.input.value = '';
            
            // Hide suggestions when user sends a message
            if (this.elements.suggestions) {
                this.elements.suggestions.style.display = 'none';
            }

            // Show typing indicator
            const typingIndicator = this.showTypingIndicator();

            try {
                const res = await fetch(`${this.apiUrl}/chat?business=${this.businessId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-Id': this.sessionId
                    },
                    body: JSON.stringify({ message: text })
                });
                const data = await res.json();
                
                // Hide typing indicator
                this.hideTypingIndicator(typingIndicator);
                
                this.appendMessage(data.response || 'Sorry, I didn\'t understand that.');
                
                // Show new suggestions if provided in response
                if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
                    this.renderSuggestions(data.suggestions);
                }
            } catch (err) {
                // Hide typing indicator
                this.hideTypingIndicator(typingIndicator);
                this.appendMessage('Something went wrong.');
            }
        }

        updateBusinessName(businessName, businessLogo = null) {
            if (this.elements.businessName && businessName) {
                this.elements.businessName.textContent = `Chat with ${businessName}`;
                
                // Update brand logo with business logo or first letter
                if (this.elements.brandLogo) {
                    if (businessLogo) {
                        // Use business logo
                        this.elements.brandLogo.innerHTML = `<img src="${businessLogo}" alt="${businessName}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;" />`;
                    } else {
                        // Fallback to first letter
                        this.elements.brandLogo.textContent = businessName.charAt(0).toUpperCase();
                    }
                }
                
                // Update toggle button title
                if (this.elements.toggle) {
                    this.elements.toggle.title = `Chat with ${businessName}`;
                }
            }
        }

        renderSuggestions(items) {
            if (!this.elements.suggestions || !Array.isArray(items)) {
                console.warn('Suggestions element not found or invalid items');
                return;
            }
            
            this.elements.suggestions.innerHTML = '';
            items.slice(0,6).forEach((s) => {
                const chip = document.createElement('button');
                chip.className = 'chip';
                chip.type = 'button';
                chip.textContent = s;
                chip.onclick = () => { 
                    this.elements.input.value = s; 
                    this.sendMessage(); 
                };
                this.elements.suggestions.appendChild(chip);
            });
            this.elements.suggestions.style.display = 'flex';
        }

        setupMobileOptimizations() {
            // Ensure viewport meta tag exists for proper mobile scaling
            if (!document.querySelector('meta[name="viewport"]')) {
                const viewport = document.createElement('meta');
                viewport.name = 'viewport';
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                document.head.appendChild(viewport);
            }

            // Only prevent body scroll on mobile devices when widget is open
            const isMobile = window.innerWidth <= 768;
            const widget = this.elements.widget;
            if (widget && isMobile) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const isVisible = widget.classList.contains('show');
                            if (isVisible) {
                                document.body.style.overflow = 'hidden';
                            } else {
                                document.body.style.overflow = '';
                            }
                        }
                    });
                });
                observer.observe(widget, { attributes: true });
            }

            // Handle orientation changes
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (this.elements.widget && this.elements.widget.classList.contains('show')) {
                        this.elements.widget.classList.remove('show');
                        setTimeout(() => {
                            this.elements.widget.classList.add('show');
                        }, 100);
                    }
                }, 500);
            });
        }

        applyTheme(color, secondaryColor) {
            // Accepts hex or css color string. For hex, compute a secondary shade and chip colors.
            const root = document.documentElement;
            if (!color) return;
            let primary = color;
            let primary2 = color;
            let secondary = secondaryColor || '#ffffff'; // Default to white if no secondary color
            let chipBg = '#e2f2ff', chipBorder = '#bae6fd', chipText = '#0369a1', chipHover = '#dbeafe';
            const hex = color.startsWith('#') ? color.replace('#','') : null;
            if (hex && (hex.length === 3 || hex.length === 6)) {
                const toRGB = (h) => {
                    if (h.length === 3) h = h.split('').map(c=>c+c).join('');
                    const n = parseInt(h,16); return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
                };
                const toHex = (n) => n.toString(16).padStart(2,'0');
                const lighten = (h, amt=0.15) => {
                    const {r,g,b}=toRGB(h);
                    const lr=Math.min(255, Math.round(r+(255-r)*amt));
                    const lg=Math.min(255, Math.round(g+(255-g)*amt));
                    const lb=Math.min(255, Math.round(b+(255-b)*amt));
                    return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`;
                };
                const mixWithWhite = (h, amt=0.85) => {
                    const {r,g,b}=toRGB(h);
                    const mr=Math.min(255, Math.round(r+(255-r)*amt));
                    const mg=Math.min(255, Math.round(g+(255-g)*amt));
                    const mb=Math.min(255, Math.round(b+(255-b)*amt));
                    return `#${toHex(mr)}${toHex(mg)}${toHex(mb)}`;
                };
                primary = '#' + hex;
                primary2 = lighten(hex, 0.25);
                chipBg = mixWithWhite(hex, 0.90);
                chipBorder = mixWithWhite(hex, 0.80);
                chipText = lighten(hex, 0.1);
                chipHover = mixWithWhite(hex, 0.85);
            }
            root.style.setProperty('--c-primary', primary);
            root.style.setProperty('--c-primary-2', primary2);
            root.style.setProperty('--c-secondary', secondary);
            root.style.setProperty('--c-chip-bg', chipBg);
            root.style.setProperty('--c-chip-border', chipBorder);
            root.style.setProperty('--c-chip-text', chipText);
            root.style.setProperty('--c-chip-bg-hover', chipHover);
            const scope = document.getElementById('chatbot-widget');
            if (scope) {
                scope.style.setProperty('--c-primary', primary);
                scope.style.setProperty('--c-primary-2', primary2);
                scope.style.setProperty('--c-secondary', secondary);
                scope.style.setProperty('--c-chip-bg', chipBg);
                scope.style.setProperty('--c-chip-border', chipBorder);
                scope.style.setProperty('--c-chip-text', chipText);
                scope.style.setProperty('--c-chip-bg-hover', chipHover);
            }
        }
    }

    window.initChatbotWidget = function(config) {
        return new ChatbotWidget(config);
    };
})();
