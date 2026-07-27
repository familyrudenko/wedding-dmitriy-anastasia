"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

// Все заменяемые файлы собраны здесь.
const ASSETS = {
  silk: "/assets/silk-frame.png",
  silkVideo: "/assets/silk-video.mp4",
  unlockVideo: "/assets/unlock-video.mp4",
  unlockFallback: "/assets/unlock.gif",
  heroPhoto: "/assets/hero-photo.png",
  heroVideo: "/assets/hero-video.mp4",
  music: "/assets/music.mp3",
  church: "/assets/venue-2.jpg",
  restaurant: "/assets/venue-1.jpg",
  dress: [
    "/assets/dress-1.png",
    "/assets/dress-2.jpg",
    "/assets/dress-3.jpg",
    "/assets/dress-4.jpg",
  ],
};

// Тексты, дата и адреса можно менять в одном месте.
const WEDDING = {
  groom: "СЕРГЕЙ",
  bride: "НАТАЛИЯ",
  date: "2025-09-14T12:30:00+03:00",
  displayDate: "14 | 09 | 2025",
  churchAddress:
    "Ленинградская обл., Всеволожский район, дер. Юкки, Ленинградское шоссе, дом 24Б, Храм Рождества Иоанна Предтечи",
  venueAddress: "Банкетный зал «Амулет», ул. Восстания, д. 35.",
};

const program = [
  { time: "12:30", title: "Сбор гостей у храма" },
  { time: "13:00", title: "Венчание" },
  { time: "14:00", title: "Окончание церемонии" },
  { time: "16:00", title: "Начало банкета" },
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
  const [unlocked, setUnlocked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown);
  const [map, setMap] = useState<"church" | "venue" | null>(null);
  const [slide, setSlide] = useState(0);
  const [sent, setSent] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const invitationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }),
      { threshold: 0.12 },
    );
    const items = document.querySelectorAll(".reveal");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!map) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setMap(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [map]);

  const countdownItems = useMemo(
    () => [
      [countdown.days, "дней"],
      [countdown.hours, "часов"],
      [countdown.minutes, "минут"],
      [countdown.seconds, "секунд"],
    ],
    [countdown],
  );

  async function unlock() {
    if (unlocked) return;
    setUnlocked(true);
    setSlider(100);
    try {
      await audioRef.current?.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
    window.setTimeout(
      () => invitationRef.current?.scrollIntoView({ behavior: "smooth" }),
      180,
    );
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

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  function moveSwipe(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const value = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    );
    setSlider(value);
    if (value > 82) void unlock();
  }

  const mapUrl =
    map === "church"
      ? "https://yandex.ru/map-widget/v1/org/khram_rozhdestva_ioanna_predtechi_v_yukkakh/1131454657/?ll=30.285451%2C60.109657&z=15"
      : "https://yandex.ru/map-widget/v1/org/amulet/72706144645/?ll=30.282029%2C59.852863&z=15";

  return (
    <>
      <video
        className="fabric-video"
        autoPlay
        muted
        loop
        playsInline
        poster={ASSETS.silk}
        aria-hidden="true"
      >
        <source src={ASSETS.silkVideo} type="video/mp4" />
      </video>
      <audio ref={audioRef} loop preload="metadata">
        <source src={ASSETS.music} type="audio/mpeg" />
      </audio>

      <main>
        <section className={`unlock-screen ${unlocked ? "is-unlocked" : ""}`}>
          <div className="unlock-copy">
            <p className="unlock-kicker">WEDDING DAY</p>
            <p className="unlock-hint">Разблокируйте приглашение</p>
            <div className="swipe" style={{ "--progress": `${slider * 0.82}%` } as React.CSSProperties}>
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
                  event.currentTarget.setPointerCapture(event.pointerId);
                  moveSwipe(event);
                }}
                onPointerMove={(event) => {
                  if (event.buttons === 1) moveSwipe(event);
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  if ((event.clientX - rect.left) / rect.width <= 0.72) setSlider(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "End" || event.key === "ArrowRight") void unlock();
                }}
              />
            </div>
          </div>
          <div className="unlock-media">
            <video autoPlay muted loop playsInline poster={ASSETS.unlockFallback}>
              <source src={ASSETS.unlockVideo} type="video/mp4" />
            </video>
            <div className="unlock-shade" />
            <div className="unlock-mobile-copy">
              <p>WEDDING DAY</p>
              <span>Разблокируйте приглашение</span>
            </div>
          </div>
        </section>

        <section ref={invitationRef} className="hero section-shell">
          <p className="hero-word hero-word-top reveal">WEDDING</p>
          <div className="hero-portrait reveal">
            <img src={ASSETS.heroPhoto} alt="Сергей и Наталия" />
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
              <span>{playing ? "Ⅱ" : "▶"}</span>
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
            {program.map((item, index) => (
              <article className="program-card reveal" key={item.time}>
                <span className="program-index">0{index + 1}</span>
                <span className="program-dot" aria-hidden="true" />
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
              <img src={ASSETS.church} alt="Храм Рождества Иоанна Предтечи" />
              <p className="address">{WEDDING.churchAddress}</p>
              <button type="button" onClick={() => setMap("church")}>Открыть карту</button>
            </article>
            <article className="location-card reveal">
              <p className="eyebrow">БАНКЕТ В РЕСТОРАНЕ</p>
              <img src={ASSETS.restaurant} alt="Банкетный зал Амулет" />
              <p className="address">{WEDDING.venueAddress}</p>
              <button type="button" onClick={() => setMap("venue")}>Открыть карту</button>
            </article>
          </div>
        </section>

        <section className="dress section-shell">
          <div className="dress-copy reveal">
            <p className="eyebrow">август</p>
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
            <img src={ASSETS.dress[slide]} alt="Пример спокойного свадебного образа" />
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

        <section className="details section-shell">
          <h2 className="section-title reveal">DETAILS</h2>
          <div className="details-grid">
            <article className="detail-card reveal">
              <p>
                Так как мы уже обустроили наш совместный быт, будем благодарны
                за денежный подарок, который поможет нам в осуществлении наших
                семейных планов.
              </p>
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
          {sent ? (
            <div className="success reveal is-visible" role="status">
              <span>СПАСИБО!</span>
              <p>Ваш ответ сохранён в этой демонстрационной копии.</p>
              <button type="button" onClick={() => setSent(false)}>Заполнить ещё раз</button>
            </div>
          ) : (
            <form className="rsvp-form reveal" onSubmit={submitForm}>
              <label className="name-field">
                <strong>Введите Ваше имя и фамилию</strong>
                <input
                  type="text"
                  name="name"
                  placeholder="Укажите имя и фамилию каждого гостя"
                  required
                />
              </label>
              <fieldset>
                <legend>Сможете ли Вы присутствовать на торжестве?</legend>
                <label><input type="radio" name="attendance" value="yes" required />Я приду/ Мы придем</label>
                <label><input type="radio" name="attendance" value="no" />Очень жаль, но прийти не получится</label>
              </fieldset>
              <fieldset>
                <legend>Сможете ли Вы присутствовать на венчании?</legend>
                <label><input type="radio" name="church" value="yes" required />Да</label>
                <label><input type="radio" name="church" value="banquet" />Нет, приеду/приедем сразу на банкет</label>
                <label><input type="radio" name="church" value="other" />Свой вариант</label>
              </fieldset>
              <fieldset>
                <legend>Предпочтения по горячему блюду:</legend>
                <label><input type="radio" name="food" value="fish" required />Рыба</label>
                <label><input type="radio" name="food" value="meat" />Мясо</label>
              </fieldset>
              <button className="submit-button" type="submit">Отправить</button>
            </form>
          )}
          <div className="farewell reveal">
            <strong>Мы будем счастливы видеть Вас<br />на нашем празднике!</strong>
            <p>С любовью, Сергей и Наталия!</p>
          </div>
        </section>
      </main>

      <footer>
        <p>Design by Elizaveta Sukhaia</p>
        <span>EDITABLE WEDDING INVITATION</span>
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
