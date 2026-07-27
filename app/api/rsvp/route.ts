const ATTENDANCE_LABELS: Record<string, string> = {
  yes: "Да, с удовольствием",
  no: "К сожалению, не сможет присутствовать",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      attendance?: unknown;
      website?: unknown;
    };

    // Honeypot: роботы часто заполняют скрытые поля.
    if (typeof body.website === "string" && body.website.trim()) {
      return Response.json({ ok: true });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const attendance =
      typeof body.attendance === "string" ? body.attendance : "";

    if (name.length < 2 || name.length > 120) {
      return Response.json(
        { ok: false, error: "Пожалуйста, укажите имя и фамилию." },
        { status: 400 },
      );
    }

    if (!ATTENDANCE_LABELS[attendance]) {
      return Response.json(
        { ok: false, error: "Пожалуйста, выберите вариант ответа." },
        { status: 400 },
      );
    }

    // Внесите эти два значения в переменные окружения сайта.
    // Никогда не добавляйте токен бота прямо в этот файл.
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return Response.json(
        {
          ok: false,
          error:
            "Отправка в Telegram пока не настроена. Добавьте параметры бота.",
        },
        { status: 503 },
      );
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: [
            "💌 Новый ответ на свадебное приглашение",
            "",
            `Имя: ${name}`,
            `Присутствие: ${ATTENDANCE_LABELS[attendance]}`,
          ].join("\n"),
        }),
      },
    );

    if (!telegramResponse.ok) {
      return Response.json(
        {
          ok: false,
          error:
            "Telegram не принял сообщение. Проверьте токен, ID группы и права бота.",
        },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, error: "Не удалось обработать ответ. Попробуйте ещё раз." },
      { status: 400 },
    );
  }
}
