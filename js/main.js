(() => {
    'use strict' ;

    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
    const CONFIG = JSON.parse(
        document.getElementById('siteConfig')?.textContent || '{}'
    );
    const STORAGE_KEY = 'foreu-site-state';
    const DEFAULT_STATE = {
        version: 1,
        theme: CONFIG.theme?.default || 'dark',
        heroIndex: 0, 
        contactDraft: { email: '', phone: '', message: ''}
    };
    const THEMES = new Set(
        CONFIG.theme?.validThemes || ['dark', 'grey', 'light']
    );
    
    class ForeuApp {
        constructor() {
            this.events = new EventBus() ; 
            this.state = this.loadState();
            this.cleanups = [];
            this.timers = new Set();
            this.heroTimer = null;
            this.cursorFrame = null;
            this.cursorCleanups = [];
            this.observer = null; 
            this.siteData = null; 
            this.cursor = { x: 0, y: 0, targetX: 0, targetY: 0};
            this.destroyed = false; 
        }
        async init() {
            document.documentElement.classList.add('js');
            this.cache();
            this.showLoading();
            try {
                await this.loadData();
                this.hydrate();
                this.bindEvents();
                this.applyTheme(this.state.theme, false);
                this.renderHero(this.state.heroIndex);
                this.restoreDraft();
                this.startHero();
                this.observeMotion();
                this.startCursor();
                this.hideError();
                this.hideLoading();
            } catch (error) {
                console.error('Site initialization failed:',error);
                this.showError('Failed to load site data.');
            }
        }
        cache() {
            this.html = document.documentElement;
            this.themeButtons = $$('[data-set-theme]');
            this.menu = $('#navDropdown');
            this.menuButton = $('#menuButton');
            this.themeSwitcher = $('#themeSwitcher');
            this.dynamicWord = $('#dynamicWord');
            this.heroDiagram = $('#heroDiagram');
            this.diagram = {
                node1: $('#node1'),
                node2: $('#node2'),
                node3: $('#node3'),
                connector: $('#connector')
            };
            this.themeImage = $('#themeIllustration');
            this.form = $('#inlineContactForm');
            this.toast = $('#toastNotification');
            this.toastText = $('#toastMessageText');
            this.popup = $('#customPopupModal');
            this.popupClose = $('#closePopupButton');
            this.submitButton = $('#contactSubmitButton');
            this.loading = $('#siteLoading');
            this.loadingText = $('#siteLoadingText');
            this.error = $('#siteError');
            this.errorText = $('#siteErrorMessage');
            this.retryButton = $('#siteErrorRetry');
            this.cursorElement = $('#cursorRing');
        }
        async loadData() {
            const response = await fetch('data/site-data.json', {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Site data request failed: ${response.status}`);
            }
            this.siteData = await response.json();
        }
        hydrate() {
            const data = this.siteData;
            document.title = data.meta?.title || document.title;
            this.setAttr('#metaDescription', 'content', data.meta?.description);
            this.setText('#brandName', data.brandName);
            this.setText('#brandNameFooter', data.brandName);
            this.renderNav();
            this.renderTheme();
            this.renderHeroContent();
            this.renderSections();
            this.renderFeatures();
            this.renderServices();
            this.renderFooter();
            this.renderSocial();
            this.renderForm(); 
            this.renderAssets();
            this.renderAccessibility(); 
            this.renderCopyright();
        }
        setText(selector, value, parent = document) {
            const element = $(selector, parent);
            if (element) { 
                element.textContent = value || '';
            }
        }

        setAttr(selector, name, value, parent = document) {
            const element = $(selector, parent);
            if (element && value != null) {
                element.setAttribute(name, value);
            }
        }
        renderNav() {
            if (!this.menu) return;
            this.menu.replaceChildren();
            (this.siteData.nav?.items || []).forEach(item => {
                const li= document.createElement('li');
                const link = document.createElement('a');
                li.className = 'nav-menu__item';
                link.className = 'nav-menu__link' ;
                link.href = item.href || '#';
                link.textContent = item.label || '';
                li.appendChild(link);
                this.menu.appendChild(li);
            });
        }
        renderTheme() {
            const theme = this.siteData.theme || {};
            this.setAttr(
                '#themeSwitcher',
                'aria-label',
                theme.selectorAria
            );
            this.themeButtons.forEach(button => {
                const key = button.dataset.setTheme;
                const label = theme.buttons?.[key];
                if(label) {
                    button.setAttribute('aria-label', label);
                }
            });
            this.setAttr(
                '#metaThemeColor',
                'content', 
                theme.themeColor?.[this.state.theme] || ''
            );
        }
        renderHeroContent() {
            const hero = this.siteData.hero || {};
            this.setText('#heroTitlePrefix', hero.titlePrefix);
            this.setText('#heroSubtitle', hero.subtitle);
            const primary = $('#heroActionPrimary');
            const secondary = $('#heroActionSecondary');
            if (primary) {
                primary.textContent = hero.actions?.primary?.label || '';
                primary.href = hero.actions?.primary?.href || '#';
                primary.setAttribute(
                    'aria-label',
                    hero.actions?.primary?.ariaLabel || ''
                );
            }
            if (secondary) {
                secondary.textContent = hero.actions?.secondary?.label || '';
                secondary.href = hero.actions?.secondary?.href || '#'; 
                secondary.setAttribute(
                    'aria-label',
                    hero.actions?.secondary?.ariaLabel || ''
                );
            }
        }
        renderSections() {
            const intro = this.siteData.servicesIntro || {};
            const contact = this.siteData.contact || {};
            this.setText('#servicesIntroEyebrow', intro.eyebrow);
            this.setText('#servicesIntroTitle', intro.title);
            this.setText('#servicesIntroDescription', intro.description);
            this.setText('.contact__badge', contact.badge);
            this.setText('.contact__title', contact.title);
            this.setText('.contact__description', contact.description);
        }
        renderFeatures() {
            const features = this.siteData.features || {};
            this.setText('.features__title', features.title);
            $$('.feature-card').forEach((card, index) => {
                const item = features.cards?.[index];
                if (!item) return;
                this.setText('.feature-card__title', item.title, card);
                this.setText(
                    '.feature-card__description',
                    item.description,
                    card 
                );
                const image = $('.feature-card__img', card);
                if (image) {
                    image.src = item.image || '';
                    image.alt = item.title || '';
                }
            });
        }
        renderServices() {
            (this.siteData.services || []).forEach((group, groupIndex) => {
                const number = $(`#servicesGroup${groupIndex + 1}Number`);
                const title = $(`#servicesGroup${groupIndex + 1}Title`);
                const list = $(`#servicesList${groupIndex + 1}`);

                if (number) {
                    number.textContent = group.number || '';
                }

                if(title) {
                    title.textContent = group.title || '';
                }

                if (!list) {
                    return;
                }

                list.replaceChildren();
                (group.items || []).forEach((item, itemIndex) => {

                    const article = document.createElement('article');
                    const imageWrap = document.createElement('div');
                    const content = document.createElement('div');
                    const image = document.createElement('img');
                    const index = document.createElement('span');
                    const heading = document.createElement('h4');
                    const description = document.createElement('p');
                    const headingId = `service-${groupIndex + 1}-${itemIndex}-title`;
                    article.className = 'services-network__bubble';
                    article.setAttribute('role','group');
                    article.setAttribute('aria-labelledby', headingId);
                    imageWrap.className = 'services-network__image-wrap';
                    image.className = 'services-network__image';
                    content.className = 'services-network__content';
                    index.className = 'services-network__index';
                    heading.className = 'services-network__item-title';
                    description.className = 'services-network__item-text';
                    image.src = item.image || '';
                    image.alt = item.alt || item.title || '';
                    image.width = 640; 
                    image.height = 420; 
                    image.loading = 'lazy';
                    index.textContent = String(itemIndex + 1).padStart(2, '0');
                    heading.id = headingId;
                    heading.textContent = item.title || '' ; 
                    description.textContent = item.description || '';
                    imageWrap.appendChild(image);
                    content.append(index, heading, description);
                    article.append(imageWrap, content);
                    list.appendChild(article);
                });
            });
        }
        renderFooter() {
            const footer = this.siteData.footer || {};
            this.setText(
                '#footerBrandDescription',
                footer.brandDescription
            );
            const columns = footer.columns || [];
            const targets = [
                ['footerGroupHeadingSolutions', 'footerListSolutions'],
                ['footerGroupHeadingServices', 'footerListServices'],
                ['footerGroupHeadingExpertise', 'footerListExpertise'],
                ['footerGroupHeadingCapabilities', 'footerListCapabilities'],
                ['footerGroupHeadingContactInfo', 'footerListContactInfo'],
                ['footerGroupHeadingWorkingHours', 'footerListWorkingHours']
            ];
            targets.forEach(([headingId, listId], index) => {
                const column = columns[index];
                const list = $(`#${listId}`);
                if (!column || !list) return;
                this.setText(`#${headingId}`, column.heading);
                list.replaceChildren();
                (column.items || []).forEach(item => {
                    const li = document.createElement('li');
                    const element = document.createElement(
                        item.href ? 'a':'span'
                    );
                    element.className = 'footer__link';
                    element.textContent = item.label || '';
                    if (item.href) {element.href = item.href;}
                    li.appendChild(element);
                    list.appendChild(li);
                });
            });
        }
    renderSocial() {
        const social = this.siteData.social || {};
        this.setText('#socialWhatsappText',social.whatsapp?.label);
        this.setText('#socialLinkedinText',social.linkedin?.label);
        this.setAttr('#socialWhatsapp','href',social.whatsapp?.href);
        this.setAttr('#socialLinkedin','href',social.linkedin?.href);
    }
    renderForm() {
        const form = this.siteData.form || {};
        const contact = this.siteData.contact || {};
        this.setText('#labelUserEmail',form.labels?.email);
        this.setText('#labelUserPhone',form.labels?.phone);
        this.setText('#labelUserMessage',form.labels?.message);
        this.setText('#contactSubmitText',contact.submitLabel || 'Submit');
        this.setAttr('#contactSubmitButton','aria-label',form.submitAria);
        const fields = [
            ['#userEmail', 'email'],
            ['#userPhone', 'phone'],
            ['#userMessage', 'message']
        ];
        fields.forEach(([selector, key]) => {
            const field = $(selector);
            if (!field) return; 
            field.placeholder= form.placeholders?.[key] || '';
            field.setAttribute(
                'aria-label',
                form.aria?.[key] || ''
            );
        });
    }
    renderAssets() {
        const assets = this.siteData.assets || {};
        if (this.themeImage) {
            this.themeImage.alt = assets.themeImageAlt || '';
            this.updateThemeImage();
        }
        const logos = this.siteData.logos || {};
        ['#logoLinkHeader', '#logoLinkFooter'] .forEach(selector => {
            this.setAttr(selector, 'aria-label', logos.aria);
        });
        this.setAttr('#logoImgHeader', 'alt', logos.altHeader);
        this.setAttr('#logoImgFooter', 'alt', logos.altFooter);
    }
    renderAccessibility() {
        this.setAttr(
            '#menuButton',
            'aria-label', 
            this.siteData.nav?.menuToggleAria
        );
        this.setAttr(
            '#heroDiagram',
            'aria-label',
            this.siteData.hero?.svgAriaLabel
        );
        const popupText = $('#closePopupButton');
        if (popupText) {
            popupText.textContent = this.siteData.messages?.popupOK || '';
        }
        this.setText(
            '#siteErrorRetry',
            this.siteData.messages?.retry || 'Retry'
        );
    }
    renderCopyright() {
        const element = $('#footerCopyright');
        if (!element) return;
        const brand = this.siteData.brandName || '';
        const suffix = this.siteData.footer?.copyrightSuffix || 'All rights reserved.';
        element.textContent = `© ${new Date().getFullYear()} ${brand}. ${suffix}`.trim();
    }
    bindEvents() {
        this.on(
            'theme:change',
            theme => this.applyTheme(theme)
        );
        this.on(
            'hero:change',
            index => this.renderHero(index, true)
        );
        this.on(
            'toast:show',
            message => this.showToast(message)
        );
        this.on(
            'menu:toggle',
            open => this.setMenuOpen(open)
        );
        this.themeButtons.forEach(button => {
            this.listen(button, 'click', () => {
                const theme = button.dataset.setTheme;
                if (THEMES.has(theme)) {
                    this.events.emit('theme:change', theme);
                }
            });
        });
        this.bindMenu();
        this.bindForm();
        this.bindPopup();
        
        this.listen(
            this.retryButton,'click',() => this.retry()
        );
    }

    bindMenu() {
        if (!this.menuButton || !this.menu) return;
        this.listen(
            this.menuButton, 
            'click', 
            event => {
                event.stopPropagation(); 
                this.events.emit(
                    'menu:toggle',
                    !this.menu.classList.contains(
                        'nav-menu__dropdown--open'
                    )
                );
            }
        );
        this.listen(document, 'click', event => {
            if(
                !this.menuButton.contains(event.target)&& 
                !this.menu.contains(event.target)
            ) {
                this.events.emit('menu:toggle', false);
            }
        });
        this.listen(document, 'keydown', event => {
            if (event.key === 'Escape') {
                this.events.emit('menu:toggle', false);
            }
        });
        this.listen(this.menu, 'click', event => {
            if (event.target.closest('a')){
                this.events.emit('menu:toggle', false);
            }
        });
    }
    bindForm() {
        if (!this.form) return; 

        $$('input, textarea', this.form)
            .forEach(field => {
                this.listen(
                    field, 
                    'input', 
                    () => {
                        this.setState({
                            contactDraft:
                            this.readDraft()
                        });
                    }
                );
            });
        this.listen(this.form, 'submit', event => {
            event.preventDefault();
            if (!this.form.checkValidity()) {
                this.form.reportValidity();
                return;
            }
            this.events.emit(
                'toast:show',
                this.siteData.messages?.contactThanks || 
                'Thank you! The team will contact you shortly.'
            );
            this.form.reset();
            this.setState({
                contactDraft: {
                    email: '',
                    phone: '',
                    message: ''
                }
            });
        });
    }
    bindPopup(){
        if(!this.popup || !this.popupClose) return;
        this.listen(this.popupClose, 'click', () => this.closePopup());
        this.listen(this.popup, 'click', event => {if (event.target === this.popup) {this.closePopup();}});
        this.listen(document, 'keydown', event => {
            if(
                event.key === 'Escape' && 
                this.popup.getAttribute('aria-hidden') === 'false'
            ) {
                this.closePopup();
            }
        });
    }
    openPopup(message) {
        if (!this.popup) return;
        this.setText(
            '#popupMessageText',
            message
        );
        this.popup.setAttribute(
            'aria-hidden', 
            'false'
        );
        this.popup.classList.add(
            'popup-modal--open'
        );
        this.popupClose?.focus();
    }

    closePopup(){
        if (!this.popup) return;
        this.popup.setAttribute('aria-hidden', 'true');
        this.popup.classList.remove('popup-modal--open');
        this.submitButton?.focus();
    }
    applyTheme(theme, persist = true) {
        const next = THEMES.has(theme) ? theme: 'dark';
        this.html.dataset.theme = next; 
        this.themeButtons.forEach(button => {
            const active = button.dataset.setTheme === next;

            button.classList.toggle(
                'theme-switcher__button--active',
                active
            );
            button.setAttribute(
                'aria-pressed',
                String(active)
            );
        });
        this.setState(
            {theme : next},
            {persist}
        );
        this.updateThemeImage();
        this.setAttr(
            '#metaThemeColor',
            'content',
            this.siteData.theme?.themeColor?.[next]
        );
    }
    updateThemeImage() {
        if (!this.themeImage) return;
        const assets = this.siteData?.assets || {};
        this.themeImage.src = this.state.theme === 'light' ? assets.themeImageLight || '' : assets.themeImageDark || '' ;
    }
    setMenuOpen(open) {
        if (!this.menu || !this.menuButton) return;
        this.menu.classList.toggle(
            'nav-menu__dropdown--open',
            open
        );
        this.menuButton.setAttribute(
            'aria-expanded',
            String(open)
        );
    }
    startHero() {
        this.stopHero();
        const words = this.siteData.hero?.words || []; 

        if (
            !words.length || !this.dynamicWord || window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches
        ) {
            return;
        }
        this.heroTimer = setInterval(() => {
            const next = (this.state.heroIndex + 1) % words.length;
            this.events.emit('hero:change', next);
        }, 3200);
    }
    stopHero() {
        if (this.heroTimer) {
            clearInterval(this.heroTimer);
            this.heroTimer = null;
        }
    }
    renderHero(index, animate = false) {
        const words = this.siteData.hero?.words || [];
        const diagrams = this.siteData.hero?.diagrams || [];
        if (!words.length) return;
        const safeIndex = ((index % words.length) + words.length) % words.length; 
        const update = () => {
            this.setState({heroIndex: safeIndex});
            if (this.dynamicWord) {
                this.dynamicWord.textContent = words[safeIndex];
            }
            if(diagrams[safeIndex]) {
                this.renderDiagram(diagrams[safeIndex]);
            }
        };
        if (!animate || !this.dynamicWord) {
            update();
            return;
        }
        this.dynamicWord.classList.add(
            'hero__dynamic-word--swap-out'
        );
        this.timer(() => {
            update();
            this.dynamicWord?.classList.remove(
                'hero__dynamic-word--swap-out'
            );
            this.dynamicWord?.classList.add(
                'hero__dynamic-word--swap-in'
            );
            requestAnimationFrame(() => {
                this.dynamicWord?.classList.remove(
                    'hero__dynamic-word--swap-in'
                );
            });
        }, 280);
    }

    renderDiagram(data) {
        if (!data) return;
        const attrs = (element, values) => {
            if (!element) return;
            Object.entries(values).forEach(([key, value]) => {
                if (value !== undefined){
                    element.setAttribute(key, value);
                }
            });
        };
        attrs(this.diagram.node1, {
            x: data.node1?.[0], 
            y: data.node1?.[1],
            width: data.node1?.[2],
            height:data.node1?.[3],
            'fill-opacity': data.node1?.[4]
        });
        attrs(this.diagram.node2, {
            x: data.node2?.[0],
            y:data.node2?.[1],
            width: data.node2?.[2],
            height: data.node2?.[3],
            'fill-opacity': data.node2?.[4]
        });
        attrs(this.diagram.node3, {
            cx: data.node3?.[0],
            cy: data.node3?.[1],
            r: data.node3?.[2]
        });
        attrs(this.diagram.connector, {
            d: data.connector?.[0],
            'stroke-dasharray': data.connector?.[1]
        });
    }
observeMotion() {
    this.observer?.disconnect();

    const elements = $$('.motion-reveal');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; 
    if(!elements.length || reduced || !('IntersectionObserver' in window)) {
        elements.forEach(el => { el.classList.add('motion-reveal--visible');
    });
    return;
    }
    this.observer = new IntersectionObserver(entries => { entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        }
        entry.target.classList.add('motion-reveal--visible');
        this.observer.unobserve(entry.target);
    });
}, {
    rootMargin: '-0px 0px -8% 0px', threshold: 0.1
   }
);
elements.forEach(el => this.observer.observe(el));
            }
            startCursor() {
                this.stopCursor();

                const finePointer = window.matchMedia('(pointer: fine)').matches;
                const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (
                    !this.cursorElement || !finePointer || reduceMotion
                ) {
                    return;
                }
                const pointerMove = event => {
                    this.cursor.targetX = event.clientX;
                    this.cursor.targetY = event.clientY;
                    this.cursorElement.classList.add(
                        'cursor--visible'
                    );
                };
                const pointerOver = event => {
                    if (!(event.target instanceof Element)) return;
                    this.cursorElement.classList.toggle(
                        'cursor--interactive',
                        Boolean( 
                            event.target.closest(
                                'a,button,input,textarea,select,label'
                            )
                        )
                    );
                };
                window.addEventListener(
                    'pointermove', pointerMove, {passive: true}
                );
                document.addEventListener(
                    'pointerover', pointerOver 
                );
                this.cursorCleanups.push(() => {
                    window.removeEventListener(
                        'pointermove', pointerMove
                    );
                    document.removeEventListener(
                        'pointerover',
                        pointerOver
                    );
                });
                const animate = () => {
                    if (!this.cursorElement) return;

                    this.cursor.x += (this.cursor.targetX - this.cursor.x) * 0.18;
                    this.cursor.y += (this.cursor.targetY - this.cursor.y) * 0.18;
                    const size = this.cursorElement.classList.contains(
                        'cursor--interactive'
                    ) ? 16 : 9; 
                     
                    this.cursorElement.style.transform = 
                        `translate3d(${this.cursor.x - size}px, ${this.cursor.y - size}px, 0)`;
                    this.cursorFrame = requestAnimationFrame(animate);
                };
                this.cursorFrame = requestAnimationFrame(animate);
            }



            stopCursor() {
                if (this.cursorFrame) {
                    cancelAnimationFrame(this.cursorFrame);
                    this.cursorFrame= null; 
                }
                this.cursorCleanups.splice(0).forEach(cleanup => cleanup());

                this.cursorElement?.classList.remove(
                    'cursor--visible',
                    'cursor--interactive'
                );
            }

            readDraft() {
                return {
                    email: $('#userEmail', this.form)?.value || '',
                    phone: $('#userPhone', this.form)?.value || '',
                    message: $('#userMessage', this.form)?.value || ''
                };
            }

            restoreDraft() {
                if (!this.form) return;

                const draft = this.state.contactDraft || {};
                const email = $('#userEmail', this.form);
                const phone = $('#userPhone', this.form);
                const message = $('#userMessage', this.form);
                if(email) {email.value = draft.email || '';}
                if (phone) {phone.value = draft.phone || '';}
                if (message) {message.value = draft.message || '';}
            }
            showToast(message) {
                if (!this.toast || !this.toastText) {return;}
                this.toastText.textContent = message || '';
                this.toast.classList.add(
                    'toast-notification--visible'
                );
                this.timer(() => {
                    this.toast?.classList.remove(
                        'toast-notification--visible'
                    );
                }, 4000);
            }
            showLoading(message = '') {
                if (message && this.loadingText) {
                    this.loadingText.textContent = message;
                }
                if (this.loading) {
                    this.loading.style.display = 'flex';
                }
            }
            hideLoading() {
                if (this.loading) {this.loading.style.display = 'none';}
                if (this.loadingText) {this.loadingText.textContent = '';}
            }
            showError(message) {
                this.hideLoading();
                if (this.errorText) {
                    this.errorText.textContent = message || 'An error occurred.';
                }
                if (this.error) {
                    this.error.style.display = 'flex';
                    this.error.setAttribute('aria-hidden', 'false');
                }
            }
            hideError() {
                if (this.error) {
                    this.error.style.display= 'none';
                    this.error.setAttribute('aria-hidden', 'true');
                }
                if (this.errorText) {
                    this.errorText.textContent = '';
                }
            }
            
            setState(partial, options = { persist: true}) {
                this.state = Object.freeze({
                    ...this.state,
                    ...partial
                });
                if (options.persist) {
                    this.saveState();
                }
            }
            
            loadState() {
                try {
                    const saved = JSON.parse(
                        localStorage.getItem(STORAGE_KEY)
                    );
                    
                    if (!saved || typeof saved !== 'object') {
                        return this.legacyState();
                    } 
                    return {
                        version: saved.version || 1, 
                        theme: THEMES.has(saved.theme)
                        ? saved.theme : 'dark',
                        heroIndex: Number.isInteger(saved.heroIndex)
                        ? saved.heroIndex : 0,
                        contactDraft: {
                        email: saved.contactDraft?.email || '',
                        phone: saved.contactDraft?.phone || '',
                        message: saved.contactDraft?.message || ''
                    }
                };
            } catch {
                return this.legacyState();
            }
        }
        legacyState() {
            let theme = null;

            const LEGACY_THEME_KEYS = CONFIG.theme?.legacyKeys || ['foreu-theme', 'prodesk-theme'];
            LEGACY_THEME_KEYS.some(keys => {
                try {
                    const value = localStorage.getItem(keys);
                    if (THEMES.has(value)) {
                        theme = value;
                        return true;
                    }
                } catch {}
                return false;
            });
            return {
                ...DEFAULT_STATE, 
                theme: theme || DEFAULT_STATE.theme,
                contactDraft: {...DEFAULT_STATE.contactDraft}
            };
        }

        saveState() {
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(this.state)
                );
            } catch {}
        }
      

        on(name, callback) {
            this.cleanups.push(
                this.events.on(name, callback)
            );
        }
        
        listen(target, event, handler, options) {
            if (!target?.addEventListener) return;
            target.addEventListener(event, handler, options);
            this.cleanups.push(() => {
                target.removeEventListener(event,handler, options);
            });
        }

        timer(callback, delay) {
            const id = setTimeout(() => {
                this.timers.delete(id);
                callback();
            }, delay);
            this.timers.add(id);
            return id;
        }
        clearTimers() {
            this.timers.forEach(id => clearTimeout(id));
            this.timers.clear();
        }

        async retry() {
            this.hideError();
            this.showLoading('Reloading site data...');
            this.stopHero();
            this.stopCursor();
            this.clearTimers();
            this.observer?.disconnect();
            this.observer = null;
            try {
                await this.loadData();
                this.hydrate();
                this.applyTheme(this.state.theme, false);
                this.renderHero(this.state.heroIndex);
                this.restoreDraft();
                this.startHero();
                this.observeMotion();
                this.startCursor();
                this.hideLoading();
            } catch (error) {
                console.error('Data reload failed:', error);
                this.showError('Failed to load site data.');
            }
        }
        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            
            this.stopHero();
            this.stopCursor();
            this.observer?.disconnect();
            this.observer = null;

            this.clearTimers();

            this.cleanups.splice(0).forEach(cleanup => cleanup());
            this.events.clear();
            if (window.foreuApp === this) {
                window.foreuApp = null;
            }
            document.documentElement.classList.remove('js');
        }
    }
    document.addEventListener('DOMContentLoaded', async () => {
        const app = new ForeuApp();
        window.foreuApp = app;
        window.destroyApp = () => app.destroy();
        await app.init();
    }, {once: true});
})();

    