"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

// Все заменяемые файлы собраны здесь.
const ASSETS = {
  silk: "/assets/silk-frame.webp",
  silkVideo: "/assets/silk-video-mobile.mp4",
  unlockVideo: "/assets/unlock-video-mobile.mp4",
  unlockFallback: "/assets/unlock-poster.jpg",
  heroPhoto: "/assets/hero-photo.webp",
  music: "/assets/wedding-music-128.mp3",
  church: "/assets/venue-2.webp",
  restaurant: "/assets/venue-1.webp",
  detailsPhoto: "/assets/details-placeholder.webp",
  history: {
    bouquet: "/assets/history-bouquet.webp",
    road: "/assets/history-road.webp",
    proposal: "/assets/history-proposal.webp",
  },
  dress: [
    "/assets/dress-1.webp",
    "/assets/dress-2.webp",
    "/assets/dress-3.webp",
    "/assets/dress-4.webp",
  ],
};

// Тексты, дата и адреса можно менять в одном месте.
const WEDDING = {
  groom: "ДМИТРИЙ",
  bride: "АНАСТАСИЯ",
  date: "2026-09-26T15:00:00+03:00",
  displayDate: "26 | 09 | 2026",
  churchAddress:
    "улица Миллера, 58, Симферополь, Республика Крым, 295003",
  venueAddress: "Киевская улица, 80, Симферополь, Республика Крым, 295034",
};

const program = [
  { time: "14:45", title: "Сбор гостей у ЗАГСа" },
  { time: "14:55", title: "Welcom Drink" },
  { time: "15:30", title: "Фотосессия" },
  { time: "20:00", title: "Свадебный банкет" },
];

function getCountdown() {
  const distance = Math.max(0, new Date(WEDDING.date).getTime() - Date.now());
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

export default function Home() {
  const [slider, setSlider] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown);
  const [map, setMap] = useState<"church" | "venue" | null>(null);
  const [slide, setSlide] = useState(0);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const draggingRef = useRef(false);
  const sliderValueRef = useRef(0);
  const pointerOffsetRef = useRef(0);
  const unlockingRef = useRef(false);
  const unlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        }),
      { threshold: 0.16, rootMargin: "0px 0px -7% 0px" },
    );
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    items.forEach((item, index) => {
      const stagger = item.classList.contains("program-card")
        ? Array.from(item.parentElement?.children ?? []).indexOf(item)
        : index % 3;
      item.style.setProperty(
        "--reveal-delay",
        `${Math.max(0, stagger) * 110}ms`,
      );
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!map) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setMap(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [map]);

  useEffect(() => {
    document.documentElement.classList.toggle("invitation-locked", !unlocked);
    return () => document.documentElement.classList.remove("invitation-locked");
  }, [unlocked]);

  const countdownItems = useMemo(
    () => [
      [countdown.days, "дней"],
      [countdown.hours, "часов"],
      [countdown.minutes, "минут"],
      [countdown.seconds, "секунд"],
    ],
    [countdown],
  );

  function unlock() {
    if (unlocked || unlockingRef.current) return;

    // Mobile browsers allow autoplay only while the user's gesture is active.
    const playAttempt = audioRef.current?.play();

    draggingRef.current = false;
    sliderValueRef.current = 100;
    unlockingRef.current = true;
    setIsDragging(false);
    setUnlocking(true);
    setSlider(100);
    playAttempt
      ?.then(() => setPlaying(true))
      .catch(() => setPlaying(false));

    unlockTimerRef.current = window.setTimeout(() => {
      setUnlocked(true);
      setUnlocking(false);
      unlockingRef.current = false;
      unlockTimerRef.current = null;
    }, 860);
  }

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setFormError("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          attendance: data.get("attendance"),
          website: data.get("website"),
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Не удалось отправить ответ.");
      }

      form.reset();
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Не удалось отправить ответ. Попробуйте ещё раз.",
      );
    } finally {
      setSending(false);
    }
  }

  function moveSwipe(clientX: number, element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    const thumbSize = 52;
    const travel = Math.max(1, rect.width - thumbSize);
    const value = Math.max(
      0,
      Math.min(
        100,
        ((clientX - pointerOffsetRef.current - rect.left - thumbSize / 2) /
          travel) *
          100,
      ),
    );
    sliderValueRef.current = value;
    setSlider(value);
    return value;
  }

  const mapUrl =
    map === "church"
      ? "https://yandex.ru/map-widget/v1/org/khram_rozhdestva_ioanna_predtechi_v_yukkakh/1131454657/?ll=30.285451%2C60.109657&z=15"
      : "https://yandex.ru/map-widget/v1/org/amulet/72706144645/?ll=30.282029%2C59.852863&z=15";

  return (
    <>
      {unlocked && (
        <video
          className="fabric-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={ASSETS.silk}
          aria-hidden="true"
        >
          <source src={ASSETS.silkVideo} type="video/mp4" />
        </video>
      )}
      <audio ref={audioRef} loop preload="metadata">
        <source src={ASSETS.music} type="audio/mpeg" />
      </audio>

      <div className="desktop-gate">
        <div className="desktop-phone" aria-hidden="true">
          <span />
        </div>
        <h1>Приглашение доступно на телефоне</h1>
        <p>Пожалуйста, откройте эту страницу со смартфона.</p>
      </div>

      <main className={unlocking ? "is-unlocking" : ""}>
        {!unlocked && <section className={`unlock-screen ${unlocking ? "is-opening" : ""}`}>
          <div className="unlock-copy">
            <p className="unlock-kicker">WEDDING DAY</p>
            <p className="unlock-hint">Разблокируйте приглашение</p>
            <div
              className={`swipe ${isDragging ? "is-dragging" : ""}`}
              style={{
                "--progress": `calc(${slider}% - ${slider * 0.52}px)`,
              } as React.CSSProperties}
            >
              <span className="swipe-arrow" aria-hidden="true">›</span>
              <span className="swipe-dots" aria-hidden="true">
                {Array.from({ length: 11 }).map((_, index) => (
                  <i key={index} />
                ))}
              </span>
              <span className="swipe-end" aria-hidden="true" />
              <div
                className="swipe-hit"
                role="slider"
                tabIndex={0}
                aria-label="Разблокировать приглашение"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(slider)}
                onPointerDown={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const thumbCenter =
                    rect.left +
                    (slider / 100) * (rect.width - 52) +
                    26;
                  if (Math.abs(event.clientX - thumbCenter) > 38) return;

                  event.preventDefault();
                  draggingRef.current = true;
                  setIsDragging(true);
                  pointerOffsetRef.current = event.clientX - thumbCenter;
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (draggingRef.current) {
                    event.preventDefault();
                    moveSwipe(event.clientX, event.currentTarget);
                  }
                }}
                onPointerUp={(event) => {
                  if (!draggingRef.current) return;

                  const finalValue = moveSwipe(
                    event.clientX,
                    event.currentTarget,
                  );
                  draggingRef.current = false;
                  setIsDragging(false);
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                  if (finalValue >= 92) {
                    unlock();
                  } else {
                    sliderValueRef.current = 0;
                    setSlider(0);
                  }
                }}
                onPointerCancel={() => {
                  draggingRef.current = false;
                  setIsDragging(false);
                  sliderValueRef.current = 0;
                  setSlider(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "End" || event.key === "ArrowRight") unlock();
                }}
              />
            </div>
          </div>
          <div className="unlock-media">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={ASSETS.unlockFallback}
            >
              <source src={ASSETS.unlockVideo} type="video/mp4" />
            </video>
            <div className="unlock-shade" />
            <div className="unlock-mobile-copy">
              <p>WEDDING DAY</p>
              <span>Разблокируйте приглашение</span>
            </div>
          </div>
        </section>}

        <section className="hero section-shell">
          <p className="hero-word hero-word-top reveal">WEDDING</p>
          <div className="hero-portrait reveal">
            <img
              src={ASSETS.heroPhoto}
              alt="Дмитрий и Анастасия"
              decoding="async"
              fetchPriority="high"
            />
            <span>{WEDDING.groom} &nbsp;И&nbsp; {WEDDING.bride}</span>
          </div>
          <p className="hero-word hero-word-bottom reveal">DAY</p>
          <div className="music-block reveal">
            <p>включите музыку нашей любви...</p>
            <button
              className={`music-button ${playing ? "is-playing" : ""}`}
              type="button"
              onClick={toggleMusic}
              aria-label={playing ? "Поставить музыку на паузу" : "Включить музыку"}
            >
              <span
                className={playing ? "pause-glyph" : "play-glyph"}
                aria-hidden="true"
              />
            </button>
          </div>
        </section>

        <section className="welcome section-shell">
          <div className="welcome-grid">
            <div className="welcome-title reveal">
              <p className="eyebrow">WEDDING DAY</p>
              <h1>
                {WEDDING.groom}
                <span>И</span>
                {WEDDING.bride}
              </h1>
            </div>
            <div className="welcome-copy reveal">
              <h2>ДОРОГИЕ ГОСТИ!</h2>
              <p>
                Спешим сообщить вам радостную новость — мы женимся! И с
                удовольствием приглашаем Вас на нашу свадьбу!
              </p>
              <strong>{WEDDING.displayDate}</strong>
            </div>
          </div>
          <div className="countdown reveal">
            <h2>ДО ТОРЖЕСТВА ОСТАЛОСЬ...</h2>
            <div className="countdown-row">
              {countdownItems.map(([value, label]) => (
                <div className="countdown-item" key={label}>
                  <span>{String(value).padStart(2, "0")}</span>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="program section-shell">
          <h2 className="section-title reveal">PROGRAM<br />OF THE DAY</h2>
          <div className="program-line" aria-hidden="true" />
          <div className="program-grid">
            {program.map((item) => (
              <article className="program-card reveal" key={item.time}>
                <time>{item.time}</time>
                <p>{item.title}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="locations section-shell">
          <h2 className="section-title reveal">LOCATION</h2>
          <div className="location-grid">
            <article className="location-card reveal">
              <p className="eyebrow">МЕСТО ПРОВЕДЕНИЯ ЦЕРЕМОНИИ</p>
              <img
                src={ASSETS.church}
                alt="ЗАГС улица Миллера, 58"
                loading="lazy"
                decoding="async"
              />
              <p className="address">{WEDDING.churchAddress}</p>
              <button type="button" onClick={() => setMap("church")}>Открыть карту</button>
            </article>
            <article className="location-card reveal">
              <p className="eyebrow">БАНКЕТ В РЕСТОРАНЕ</p>
              <img
                src={ASSETS.restaurant}
                alt="Банкетный зал Чистые пруды"
                loading="lazy"
                decoding="async"
              />
              <p className="address">{WEDDING.venueAddress}</p>
              <button type="button" onClick={() => setMap("venue")}>Открыть карту</button>
            </article>
          </div>
        </section>

        <section className="dress section-shell">
          <div className="dress-copy reveal">
            <h2 className="section-title">DRESS CODE</h2>
            <p>
              Мы рады сообщить, что дресс-кода на нашей свадьбе не будет. Тем
              не менее, мы просим воздержаться от ярких цветов и броских
              принтов. Будем очень рады, если вы отдадите предпочтение
              спокойным и нейтральным тонам.
            </p>
          </div>
          <div className="dress-gallery reveal">
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={() => setSlide((slide - 1 + ASSETS.dress.length) % ASSETS.dress.length)}
            >
              ‹
            </button>
            <img
              src={ASSETS.dress[slide]}
              alt="Пример спокойного свадебного образа"
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={() => setSlide((slide + 1) % ASSETS.dress.length)}
            >
              ›
            </button>
            <div className="gallery-dots">
              {ASSETS.dress.map((_, index) => (
                <button
                  type="button"
                  aria-label={`Показать фото ${index + 1}`}
                  className={index === slide ? "active" : ""}
                  onClick={() => setSlide(index)}
                  key={index}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="history section-shell">
          <div className="history-heading reveal">
            <p className="eyebrow">НАША ИСТОРИЯ</p>
            <h2 className="section-title history-title">
              <span>HISTORY</span>
              <span>LOVE</span>
            </h2>
          </div>

          <div className="history-stream">
            <article className="history-copy history-copy-left reveal">
              <span className="history-step">01</span>
              <p>
                Иногда судьба приходит совсем неожиданно. Незадолго до их
                знакомства цыганка остановила её на улице и сказала: «Совсем
                скоро ты встретишь свою любовь».
              </p>
            </article>

            <figure className="history-photo history-photo-right reveal">
              <img
                src={ASSETS.history.bouquet}
                alt="Мужчина протягивает любимой большой букет цветов"
                loading="lazy"
                decoding="async"
              />
              <figcaption>ПЕРВАЯ ВСТРЕЧА</figcaption>
            </figure>

            <article className="history-copy history-copy-right reveal">
              <span className="history-step">02</span>
              <p>
                Вскоре в её жизни появился он — с большим букетом цветов и
                сердцем, полным решимости, мчащийся к ней из Симферополя в
                Севастополь.
              </p>
            </article>

            <article className="history-copy history-copy-left reveal">
              <span className="history-step">03</span>
              <p>
                Их история началась между двумя городами, дорогами и
                долгожданными встречами. Каждую неделю он приезжал к ней, а
                расстояние лишь сильнее сближало их сердца.
              </p>
            </article>

            <figure className="history-photo history-photo-left reveal">
              <img
                src={ASSETS.history.road}
                alt="Влюблённые идут вместе по дороге между двумя городами"
                loading="lazy"
                decoding="async"
              />
              <figcaption>ДВА ГОРОДА — ОДНА ИСТОРИЯ</figcaption>
            </figure>

            <article className="history-copy history-copy-right reveal">
              <span className="history-step">04</span>
              <p>
                Совсем скоро они поняли: друг без друга уже невозможно. Она
                переехала к нему — и два разных города стали одним общим домом.
              </p>
            </article>

            <article className="history-copy history-copy-left reveal">
              <span className="history-step">05</span>
              <p>
                Спустя два года, во время новогоднего путешествия по Армении,
                среди огней, гор и зимнего волшебства он сделал ей предложение.
              </p>
            </article>

            <figure className="history-photo history-photo-right reveal">
              <img
                src={ASSETS.history.proposal}
                alt="Предложение руки и сердца во время зимнего путешествия"
                loading="lazy"
                decoding="async"
              />
              <figcaption>АРМЕНИЯ · НОВАЯ ГЛАВА</figcaption>
            </figure>

            <article className="history-copy history-final reveal">
              <span className="history-step">∞</span>
              <p>
                Так началась новая глава истории о любви, когда-то предсказанной
                судьбой. И теперь они приглашают вас разделить самый важный и
                счастливый день — день их свадьбы.
              </p>
            </article>
          </div>
        </section>

        <section className="details section-shell">
          <h2 className="section-title reveal">DETAILS</h2>
          <div className="details-grid">
            <article className="detail-card detail-photo-card reveal">
              <img
                className="details-photo"
                src={ASSETS.detailsPhoto}
                alt="Свадебные кольца на руках молодожёнов"
                loading="lazy"
                decoding="async"
              />
            </article>
            <article className="detail-card reveal">
              <p>
                Ресторан и формат нашего праздника не предполагают детской
                площадки и аниматоров. Пожалуйста, позаботьтесь о том, чтобы
                провести этот вечер без детей.
              </p>
            </article>
          </div>
        </section>

        <section className="rsvp section-shell">
          <h2 className="section-title reveal">АНКЕТА</h2>
          <p className="rsvp-lead reveal">
            Пожалуйста, подтвердите своё присутствие — это займёт меньше минуты.
          </p>
          {sent ? (
            <div className="success reveal is-visible" role="status">
              <span>СПАСИБО!</span>
              <p>Ваш ответ отправлен Дмитрию и Анастасии.</p>
              <button type="button" onClick={() => setSent(false)}>Заполнить ещё раз</button>
            </div>
          ) : (
            <form className="rsvp-form reveal" onSubmit={submitForm}>
              <div className="form-heading">
                <span>RSVP</span>
                <h3>Будем ждать ваш ответ</h3>
              </div>
              <label className="name-field">
                <strong>Имя и фамилия</strong>
                <input
                  type="text"
                  name="name"
                  placeholder="Например, Анна Иванова"
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </label>
              <fieldset className="attendance-field">
                <legend>Сможете ли вы присутствовать на свадьбе?</legend>
                <label className="answer-option">
                  <input type="radio" name="attendance" value="yes" required />
                  <span className="answer-mark" aria-hidden="true" />
                  <span>Да, с удовольствием!</span>
                </label>
                <label className="answer-option">
                  <input type="radio" name="attendance" value="no" />
                  <span className="answer-mark" aria-hidden="true" />
                  <span>К сожалению, не смогу</span>
                </label>
              </fieldset>
              <label className="website-field" aria-hidden="true">
                Не заполняйте это поле
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
              {formError && (
                <p className="form-error" role="alert">{formError}</p>
              )}
              <button
                className="submit-button"
                type="submit"
                disabled={sending}
              >
                {sending ? "Отправляем..." : "Отправить ответ"}
              </button>
            </form>
          )}
          <div className="farewell reveal">
            <strong>Мы будем счастливы видеть Вас<br />на нашем празднике!</strong>
            <p>С любовью, Дмитрий и Анастасия!</p>
          </div>
        </section>
      </main>

      <footer>
        <p>Design by Dmitriy & Anastasia</p>
        <span>WEDDING</span>
      </footer>

      {map && (
        <div className="map-modal" role="dialog" aria-modal="true" aria-label="Карта">
          <button className="modal-backdrop" type="button" onClick={() => setMap(null)} aria-label="Закрыть карту" />
          <div className="map-panel">
            <button className="map-close" type="button" onClick={() => setMap(null)} aria-label="Закрыть">×</button>
            <iframe title="Карта места проведения" src={mapUrl} allowFullScreen />
          </div>
        </div>
      )}
    </>
  );
}
