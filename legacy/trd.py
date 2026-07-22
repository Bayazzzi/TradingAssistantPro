import customtkinter as ctk
import datetime
import pytz
import threading
import requests
import winsound
import yfinance as yf
import time
import random
import webbrowser
from bs4 import BeautifulSoup

# --- Настройки ---
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")
ctk.set_widget_scaling(1.0)
ctk.set_window_scaling(1.0)

class TradingAssistantApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Trading Assistant Pro v7")
        
        # --- ВАШИ ДАННЫЕ ---
        self.author_name = "Dev: Arman Bayazi"  
        self.author_link = "https://t.me/mr_bayazi" 
        # -------------------

        # Размеры
        self.w_full = 950
        self.h_full = 800 
        self.w_mini = 300
        self.h_mini = 160 
        
        self.is_mini_mode = False
        self.sound_enabled = True 
        self.news_sound_enabled = True
        
        # Сетка
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=0) # Тикер
        self.grid_rowconfigure(1, weight=0) # Панель
        self.grid_rowconfigure(2, weight=0) # Часы
        self.grid_rowconfigure(3, weight=1) # Вкладки
        self.grid_rowconfigure(4, weight=0) # Футер

        # === 1. БЕГУЩАЯ СТРОКА ===
        self.ticker_frame = ctk.CTkFrame(self, height=35, corner_radius=0, fg_color="#111111")
        self.ticker_frame.grid(row=0, column=0, sticky="ew")
        self.ticker_frame.grid_propagate(False)
        self.ticker_label = ctk.CTkLabel(self.ticker_frame, text="Загрузка рынка...", font=("Consolas", 14, "bold"), text_color="#00ffcc")
        self.ticker_label.place(x=10, y=5)
        self.ticker_text_content = ""
        self.ticker_x = 950

        # === 2. ПАНЕЛЬ УПРАВЛЕНИЯ ===
        self.ctrl_frame = ctk.CTkFrame(self, height=40, fg_color="transparent")
        self.ctrl_frame.grid(row=1, column=0, sticky="ew", padx=10, pady=(5,0))
        
        self.mode_switch = ctk.CTkSwitch(self.ctrl_frame, text="Компакт", command=self.enable_mini_mode)
        self.mode_switch.pack(side="right", padx=10)
        
        self.sound_check = ctk.CTkCheckBox(self.ctrl_frame, text="Звук Сессий 🔔", command=self.toggle_sound, onvalue=True, offvalue=False)
        self.sound_check.select()
        self.sound_check.pack(side="right", padx=10)

        self.news_sound_check = ctk.CTkCheckBox(self.ctrl_frame, text="Звук Новостей 📢", command=self.toggle_news_sound, onvalue=True, offvalue=False, text_color="orange")
        self.news_sound_check.select()
        self.news_sound_check.pack(side="right", padx=10)
        
        self.refresh_btn = ctk.CTkButton(self.ctrl_frame, text="↻ Обновить новости", width=140, height=28, command=self.manual_refresh_news)
        self.refresh_btn.pack(side="left", padx=10)

        # === 3. ЧАСЫ И СЕССИИ ===
        self.clock_frame = ctk.CTkFrame(self)
        self.clock_frame.grid(row=2, column=0, sticky="ew", padx=10, pady=10)
        
        self.sessions = {
            "London": {"tz": "Europe/London", "session": (7, 16)}, 
            "New York": {"tz": "America/New_York", "session": (12, 21)},
            "Tokyo": {"tz": "Asia/Tokyo", "session": (0, 9)},
            "Sydney": {"tz": "Australia/Sydney", "session": (21, 6)}
        }
        
        self.city_widgets = {}
        for city, data in self.sessions.items():
            frame = ctk.CTkFrame(self.clock_frame)
            frame.pack(side="left", expand=True, fill="both", padx=5, pady=5)
            
            ctk.CTkLabel(frame, text=city, font=("Arial", 14, "bold")).pack(pady=(5,0))
            icon = ctk.CTkLabel(frame, text="☀️", font=("Arial", 16))
            icon.pack()
            time_lbl = ctk.CTkLabel(frame, text="00:00", font=("Consolas", 20))
            time_lbl.pack()
            status_lbl = ctk.CTkLabel(frame, text="--", font=("Arial", 12))
            status_lbl.pack(pady=(0, 5))

            self.city_widgets[city] = {
                "time": time_lbl, "status": status_lbl, "icon": icon, "data": data, "was_open": False
            }

        # === 4. ВКЛАДКИ ===
        self.tab_view = ctk.CTkTabview(self)
        self.tab_view.grid(row=3, column=0, sticky="nsew", padx=10, pady=(0,5))
        
        self.tab_news = self.tab_view.add("Новости")
        self.tab_calc = self.tab_view.add("Калькулятор")
        self.tab_check = self.tab_view.add("Чек-лист Дисциплины")

        self.setup_news_tab()
        self.setup_calculator()
        self.setup_checklist()

        # === 5. ФУТЕР ===
        self.footer_frame = ctk.CTkFrame(self, height=30, fg_color="transparent")
        self.footer_frame.grid(row=4, column=0, sticky="ew", pady=(0, 5))
        
        self.lbl_author = ctk.CTkLabel(self.footer_frame, text=self.author_name, font=("Arial", 12), text_color="gray", cursor="hand2")
        self.lbl_author.pack()
        self.lbl_author.bind("<Button-1>", lambda e: self.open_author_link())
        self.lbl_author.bind("<Enter>", lambda e: self.lbl_author.configure(text_color="#2cc985"))
        self.lbl_author.bind("<Leave>", lambda e: self.lbl_author.configure(text_color="gray"))

        # === 6. МИНИ-ВИДЖЕТ ===
        self.mini_frame = ctk.CTkFrame(self, corner_radius=20)
        self.btn_expand = ctk.CTkButton(self.mini_frame, text="⤢", width=30, height=30, fg_color="#333", hover_color="#555", command=self.disable_mini_mode)
        self.btn_expand.place(relx=0.9, rely=0.15, anchor="center")

        self.mini_city_label = ctk.CTkLabel(self.mini_frame, text="LONDON", font=("Arial", 20, "bold"))
        self.mini_city_label.pack(pady=(25, 0))
        self.mini_timer_label = ctk.CTkLabel(self.mini_frame, text="00:00:00", font=("Consolas", 30))
        self.mini_timer_label.pack(pady=0)
        self.mini_status_label = ctk.CTkLabel(self.mini_frame, text="До закрытия", font=("Arial", 12))
        self.mini_status_label.pack(pady=(0, 10))

        # === ЗАПУСК ===
        self.center_window()
        self.update_clocks()
        threading.Thread(target=self.fetch_real_news, daemon=True).start()
        threading.Thread(target=self.update_quotes_loop, daemon=True).start()
        self.animate_ticker()

    def open_author_link(self):
        webbrowser.open(self.author_link)

    # --- ВКЛАДКИ ---
    def setup_news_tab(self):
        self.tab_news.grid_columnconfigure(0, weight=1)
        self.tab_news.grid_rowconfigure(0, weight=1)
        self.news_box = ctk.CTkTextbox(self.tab_news, font=("Consolas", 13))
        self.news_box.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)

    def setup_checklist(self):
        frame = self.tab_check
        frame.grid_columnconfigure(0, weight=1)
        style_frame = ctk.CTkFrame(frame, fg_color="transparent")
        style_frame.pack(pady=10)
        ctk.CTkLabel(style_frame, text="Твой стиль:").pack(side="left", padx=5)
        self.combo_style = ctk.CTkOptionMenu(style_frame, values=["Скальпинг (M1/M5)", "Интрадей (H1/H4)", "Свинг (D1)"], command=self.update_checklist_questions)
        self.combo_style.set("Интрадей (H1/H4)")
        self.combo_style.pack(side="left", padx=5)

        self.checklist_vars = []
        self.checklist_widgets = []
        self.default_questions = [
            "1. Тренд старшего ТФ (H1/H4) определен?",
            "2. Уровень поддержки/сопротивления подтвержден?",
            "3. Важные новости проверены (нет импульсов)?",
            "4. Риск на сделку посчитан (не более 1-2%)?",
            "5. Take Profit больше Stop Loss минимум в 2 раза?",
            "6. Я спокоен, без эмоций и желания отыграться?"
        ]
        self.checks_frame = ctk.CTkFrame(frame, fg_color="transparent")
        self.checks_frame.pack(pady=5)
        for q in self.default_questions:
            var = ctk.BooleanVar()
            chk = ctk.CTkCheckBox(self.checks_frame, text=q, variable=var, font=("Arial", 14), command=self.check_checklist_progress)
            chk.pack(pady=6, anchor="w", padx=150)
            self.checklist_vars.append(var)
            self.checklist_widgets.append(chk)
            
        self.lbl_motivation = ctk.CTkLabel(frame, text="Отметь все пункты, чтобы получить доступ...", font=("Arial", 18, "bold"), text_color="gray", wraplength=800)
        self.lbl_motivation.pack(pady=30)
        ctk.CTkButton(frame, text="Сбросить чек-лист", command=self.reset_checklist, fg_color="#555").pack(pady=10)
        self.quotes = ["Только зеленых тейк-профитов тебе! 🚀💸", "Снайперский вход! Жми кнопку! 🎯", "Дисциплина — это деньги.", "Рынок дает возможность.", "Холодная голова — залог успеха.", "Удача любит подготовленных! 🐂🐻", "Соблюдай риски!", "Не жадничай, следуй плану!", "Trend is your friend.", "Сегодня отличный день для профита!"]

    def update_checklist_questions(self, choice):
        questions = []
        if "Скальпинг" in choice:
            questions = ["1. Контекст на M15/H1 подтверждает вход?", "2. Спред минимален, волатильность есть?", "3. Нет новостей прямо сейчас?", "4. Короткий стоп-лосс рассчитан?", "5. Быстрый Take Profit намечен?", "6. Я сконцентрирован и не тильтую?"]
        elif "Свинг" in choice:
            questions = ["1. Глобальный тренд (D1/W1) за нас?", "2. Фундаментал не против?", "3. Свопы учтены?", "4. Стоп-лосс выдержит волатильность?", "5. Потенциал движения 1:3+?", "6. Я готов ждать дни до реализации?"]
        else:
            questions = ["1. Тренд старшего ТФ (H1/H4) определен?", "2. Уровень поддержки/сопротивления подтвержден?", "3. Важные новости проверены?", "4. Риск посчитан (1-2%)?", "5. TP > SL минимум в 2 раза?", "6. Я спокоен, без эмоций?"]
        for i, chk in enumerate(self.checklist_widgets):
            chk.configure(text=questions[i])
            self.checklist_vars[i].set(False)
        self.check_checklist_progress()

    def check_checklist_progress(self):
        if all(var.get() for var in self.checklist_vars):
            self.lbl_motivation.configure(text=random.choice(self.quotes), text_color="#2cc985")
            if self.sound_enabled: threading.Thread(target=lambda: winsound.Beep(2000, 150)).start()
        else: self.lbl_motivation.configure(text="Выполнены не все условия системы...", text_color="gray")

    def reset_checklist(self):
        for var in self.checklist_vars: var.set(False)
        self.lbl_motivation.configure(text="Отметь все пункты, чтобы получить доступ...", text_color="gray")

    def setup_calculator(self):
        frame = self.tab_calc
        frame.grid_columnconfigure(0, weight=1)
        frame.grid_columnconfigure(1, weight=1)
        ctk.CTkLabel(frame, text="Тип актива:").grid(row=0, column=0, padx=10, pady=10, sticky="e")
        self.combo_asset = ctk.CTkOptionMenu(frame, values=["Forex (Стандарт $10)", "Gold (XAUUSD 100oz)", "Silver (XAGUSD 5000oz)", "Bitcoin (1 BTC)", "Indices (US30/SPX)"])
        self.combo_asset.grid(row=0, column=1, padx=10, pady=10, sticky="w")
        ctk.CTkLabel(frame, text="Баланс ($):").grid(row=1, column=0, padx=10, pady=10, sticky="e")
        self.entry_balance = ctk.CTkEntry(frame, placeholder_text="10000")
        self.entry_balance.grid(row=1, column=1, padx=10, pady=10, sticky="w")
        ctk.CTkLabel(frame, text="Риск (%):").grid(row=2, column=0, padx=10, pady=10, sticky="e")
        self.entry_risk = ctk.CTkEntry(frame, placeholder_text="1")
        self.entry_risk.grid(row=2, column=1, padx=10, pady=10, sticky="w")
        ctk.CTkLabel(frame, text="Стоп-лосс (пункты/центы):").grid(row=3, column=0, padx=10, pady=10, sticky="e")
        self.entry_sl = ctk.CTkEntry(frame, placeholder_text="20")
        self.entry_sl.grid(row=3, column=1, padx=10, pady=10, sticky="w")
        btn_calc = ctk.CTkButton(frame, text="Рассчитать Лот", command=self.calculate_lot, height=40, font=("Arial", 14, "bold"))
        btn_calc.grid(row=4, column=0, columnspan=2, pady=20)
        self.lbl_result = ctk.CTkLabel(frame, text="Лот: 0.00", font=("Arial", 28, "bold"), text_color="#2cc985")
        self.lbl_result.grid(row=5, column=0, columnspan=2)
        self.lbl_info = ctk.CTkLabel(frame, text="", font=("Arial", 12), text_color="gray")
        self.lbl_info.grid(row=6, column=0, columnspan=2)

    def calculate_lot(self):
        try:
            balance = float(self.entry_balance.get().replace(",", "."))
            risk_pct = float(self.entry_risk.get().replace(",", "."))
            sl = float(self.entry_sl.get().replace(",", "."))
            risk_money = balance * (risk_pct / 100)
            asset = self.combo_asset.get()
            if "Forex" in asset: tick_value, info = 10, "Forex: 1 пункт = $10"
            elif "Gold" in asset: tick_value, info = 1, "Gold: SL в тиках (0.01)"
            elif "Silver" in asset: tick_value, info = 50, "Silver: 1 тик = $50"
            elif "Bitcoin" in asset: tick_value, info = 1, "Bitcoin: SL в $"
            elif "Indices" in asset: tick_value, info = 1, "Indices: ~$1 за пункт"
            lot = risk_money / (sl * tick_value)
            self.lbl_result.configure(text=f"Лот: {lot:.2f} (Риск: ${risk_money:.0f})")
            self.lbl_info.configure(text=info)
        except ValueError: self.lbl_result.configure(text="Ошибка ввода")

    def toggle_sound(self): self.sound_enabled = bool(self.sound_check.get())
    def toggle_news_sound(self): self.news_sound_enabled = bool(self.news_sound_check.get())
    def center_window(self):
        self.update_idletasks()
        x = int((self.winfo_screenwidth() / 2) - (self.w_full / 2))
        y = int((self.winfo_screenheight() / 2) - (self.h_full / 2))
        self.geometry(f"{self.w_full}x{self.h_full}+{x}+{y}")

    def update_quotes_loop(self):
        """Патч для выходных: берем данные за 5 дней, чтобы захватить пятницу"""
        while True:
            try:
                tickers = ["EURUSD=X", "GBPUSD=X", "JPY=X", "GC=F", "SI=F", "CL=F", "BTC-USD", "^GSPC"]
                
                # --- ИЗМЕНЕНИЕ: period="5d" вместо "1d" ---
                data = yf.download(tickers, period="5d", interval="1d", progress=False)['Close']
                
                def get_p(s, n): 
                    try: 
                        # .dropna() убирает пустые дни (субботу), .iloc[-1] берет последний рабочий день (пятницу)
                        val = data[s].dropna().iloc[-1] 
                        return f"{n}: {val:.2f}" 
                    except: return ""
                
                parts = [get_p("EURUSD=X","EUR"), get_p("GBPUSD=X","GBP"), get_p("JPY=X","JPY"), get_p("GC=F","GOLD"), get_p("SI=F","SILVER"), get_p("CL=F","OIL"), get_p("BTC-USD","BTC"), get_p("^GSPC","S&P")]
                self.ticker_text_content = "      +++      ".join([p for p in parts if p]) + "      +++      "
            except: 
                self.ticker_text_content = "Рынок спит (или нет сети)..."
            
            time.sleep(60)

    def animate_ticker(self):
        if not self.is_mini_mode and self.ticker_text_content:
            self.ticker_label.configure(text=self.ticker_text_content)
            self.ticker_x -= 2 
            if self.ticker_x < -self.ticker_label.winfo_width(): self.ticker_x = self.w_full
            self.ticker_label.place(x=self.ticker_x, y=5)
        self.after(30, self.animate_ticker)

    def update_clocks(self):
        utc = datetime.datetime.now(datetime.timezone.utc)
        active, next_s, min_t = None, None, float('inf')
        
        for city, w in self.city_widgets.items():
            tz = pytz.timezone(w["data"]["tz"])
            local = datetime.datetime.now(tz)
            w["time"].configure(text=local.strftime("%H:%M:%S"))
            
            h = local.hour
            w["icon"].configure(text="☀️" if 6 <= h < 18 else "🌙", text_color="yellow" if 6 <= h < 18 else "#a0c4ff")
            
            s, e = w["data"]["session"]
            curr = utc.hour + utc.minute/60
            wd = utc.weekday() # 0=Пн ... 5=Сб, 6=Вс

            # --- 1. ПРОВЕРКА: ОТКРЫТО ЛИ ПРЯМО СЕЙЧАС? ---
            is_open_now = False
            
            # Проверка по времени
            time_match = False
            if s < e: time_match = s <= curr < e
            else: time_match = curr >= s or curr < e # Переход через полночь
            
            if time_match:
                if city == "Sydney":
                    # Сидней работает: Вс, Пн, Вт, Ср, Чт (по UTC).
                    # В Пятницу (UTC) в 21:00 у них уже Суббота утро -> закрыто.
                    # В Субботу (UTC) -> закрыто.
                    if wd not in [4, 5]: # Не Пятница и не Суббота
                        is_open_now = True
                else:
                    # Токио, Лондон, НЙ работают: Пн, Вт, Ср, Чт, Пт.
                    # В Субботу и Воскресенье закрыты.
                    if wd not in [5, 6]:
                        is_open_now = True

            # --- ЗВУК И СТАТУС ---
            if is_open_now and not w["was_open"] and self.sound_enabled: 
                threading.Thread(target=lambda: winsound.Beep(1000, 600)).start()
            w["was_open"] = is_open_now

            if is_open_now:
                w["status"].configure(text="OPEN", text_color="#2cc985")
                # Расчет до закрытия
                edt = utc.replace(hour=e, minute=0, second=0, microsecond=0)
                if edt < utc: edt += datetime.timedelta(days=1)
                active = (city, edt - utc)
            else:
                w["status"].configure(text="CLOSED", text_color="gray")
                
                # --- 2. ЖЕЛЕЗОБЕТОННЫЙ РАСЧЕТ СЛЕДУЮЩЕГО СТАРТА ---
                # Берем время старта (сегодня)
                sdt = utc.replace(hour=s, minute=0, second=0, microsecond=0)
                # Если время старта уже прошло сегодня -> пробуем завтра
                if sdt <= utc: sdt += datetime.timedelta(days=1)
                
                # Ищем ПРАВИЛЬНЫЙ день открытия
                while True:
                    check_wd = sdt.weekday()
                    
                    if city == "Sydney":
                        # Старт разрешен только в: Вс, Пн, Вт, Ср, Чт.
                        # Запрещен старт в: Пт(4), Сб(5).
                        # (Пт 21:00 UTC = Сб утро Сидней - Вых)
                        if check_wd == 4 or check_wd == 5:
                            sdt += datetime.timedelta(days=1)
                            continue
                    else:
                        # Токио, Лондон, НЙ.
                        # Старт разрешен только в: Пн, Вт, Ср, Чт, Пт.
                        # Запрещен старт в: Сб(5), Вс(6).
                        if check_wd == 5 or check_wd == 6:
                            sdt += datetime.timedelta(days=1)
                            continue
                    
                    break # День валидный

                # Если сейчас выходные, пишем WEEKEND
                if wd == 5 or (wd == 6 and not (city == "Sydney" and curr >= s)):
                     w["status"].configure(text="WEEKEND", text_color="gray")

                diff = (sdt - utc).total_seconds()
                if diff < min_t: min_t, next_s = diff, (city, sdt - utc)

        # 3. МИНИ-ВИДЖЕТ
        if self.is_mini_mode:
            t = active if active else next_s
            if t:
                c, d = t
                total_seconds = int(d.total_seconds())
                days = total_seconds // 86400
                rem = total_seconds % 86400
                h = rem // 3600
                m = (rem % 3600) // 60
                s = rem % 60
                
                ts = f"{h:02}:{m:02}:{s:02}"
                if days > 0: ts = f"{days}д {ts}"
                
                self.mini_city_label.configure(text=c.upper())
                self.mini_timer_label.configure(text=ts, text_color="#2cc985" if active else "#ffcc00")
                self.mini_status_label.configure(text="До закрытия" if active else "До открытия", text_color="silver")
            else:
                self.mini_city_label.configure(text="MARKET")
                self.mini_timer_label.configure(text="CLOSED", text_color="#ff5555")
                self.mini_status_label.configure(text="WEEKEND", text_color="gray")
        
        self.after(1000, self.update_clocks)

    def manual_refresh_news(self):
        self.news_box.configure(state="normal")
        self.news_box.delete("0.0", "end")
        self.news_box.insert("0.0", "Загрузка...")
        self.news_box.configure(state="disabled")
        threading.Thread(target=self.fetch_real_news, daemon=True).start()

    def fetch_real_news(self):
        try:
            url = "https://ru.investing.com/economic-calendar/"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7", # Просим русский, но готовы к английскому
            }
            
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code != 200:
                raise Exception(f"Сайт не отвечает (Код {resp.status_code})")

            soup = BeautifulSoup(resp.text, 'html.parser')
            table = soup.find('table', id='economicCalendarData')
            if not table:
                raise Exception("Таблица новостей не найдена (возможно, защита сайта)")

            # Ищем строки с классом js-event-item, это надежнее
            rows = table.tbody.find_all('tr', class_='js-event-item')
            news = []
            now = datetime.datetime.now()
            beep = False
            
            for row in rows:
                try:
                    time_cell = row.find('td', class_='time')
                    t = time_cell.text.strip() if time_cell else "N/A"
                    
                    cur_cell = row.find('td', class_='left flagCur')
                    cur = cur_cell.text.strip().replace('\xa0', '') if cur_cell else ""
                    
                    evt_cell = row.find('td', class_='event')
                    evt = evt_cell.text.strip() if evt_cell else "Событие"
                    
                    # --- УНИВЕРСАЛЬНАЯ ЛОГИКА: СЧИТАЕМ КОЛИЧЕСТВО ЗВЕЗД ---
                    sent_cell = row.find('td', class_='sentiment')
                    imp = 0
                    if sent_cell:
                        # Просто считаем количество иконок 'i' (звезд) внутри ячейки.
                        # Это работает независимо от языка.
                        imp = len(sent_cell.find_all('i'))
                    # -----------------------------------------------------------

                    if imp >= 2:
                        news_item = f"[{t}] {cur} {'★'*imp} - {evt}"
                        news.append(news_item)
                        
                        if self.news_sound_enabled:
                            try:
                                if ":" in t:
                                    nh, nm = map(int, t.split(':'))
                                    ndt = now.replace(hour=nh, minute=nm, second=0)
                                    if -60 <= (ndt - now).total_seconds() <= 60: 
                                        beep = True
                            except:
                                pass
                except Exception:
                    continue

            if beep: 
                threading.Thread(target=lambda: [winsound.Beep(1500, 200) or time.sleep(0.1) for _ in range(3)]).start()
            
            txt = "\n\n".join(news) if news else "На сегодня важных (2-3★) новостей больше нет."
            
            self.news_box.configure(state="normal")
            self.news_box.delete("0.0", "end")
            self.news_box.insert("0.0", txt)
            self.news_box.configure(state="disabled")

        except Exception as e:
            self.news_box.configure(state="normal")
            self.news_box.delete("0.0", "end")
            self.news_box.insert("0.0", f"Ошибка: {e}")
            self.news_box.configure(state="disabled")
    def enable_mini_mode(self):
        if not self.mode_switch.get(): return
        self.is_mini_mode = True
        for w in [self.ticker_frame, self.ctrl_frame, self.clock_frame, self.tab_view, self.footer_frame]: w.grid_remove()
        self.mini_frame.place(relx=0.5, rely=0.5, anchor="center", relwidth=1, relheight=1)
        self.attributes("-topmost", True)
        self.geometry(f"{self.w_mini}x{self.h_mini}")
        self.after(100, self._move_to_corner)

    def _move_to_corner(self):
        self.update_idletasks()
        x = self.winfo_screenwidth() - self.w_mini - 20
        y = self.winfo_screenheight() - self.h_mini - 80
        self.geometry(f"{self.w_mini}x{self.h_mini}+{x}+{y}")

    def disable_mini_mode(self):
        self.is_mini_mode = False
        self.mode_switch.deselect()
        self.mini_frame.place_forget()
        for w in [self.ticker_frame, self.ctrl_frame, self.clock_frame, self.tab_view, self.footer_frame]: w.grid()
        self.attributes("-topmost", False)
        self.center_window()

if __name__ == "__main__":
    app = TradingAssistantApp()
    app.mainloop()