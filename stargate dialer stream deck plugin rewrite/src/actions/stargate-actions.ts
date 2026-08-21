import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

const HOST = process.env.STARGATE_STREAMDECK_HOST ?? "127.0.0.1";
const PORT = Number(process.env.STARGATE_STREAMDECK_PORT ?? 18765);
const GLYPH_COUNT = 39;

type Input = { type: "glyph"; glyph: number } | { type: "enter" } | { type: "escape" };
export type GlyphSettings = { glyph?: number };

async function sendInput(input: Input): Promise<void> {
  const response = await fetch(`http://${HOST}:${PORT}/input`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Stargate Command bridge returned ${response.status}`);
}

function glyphValue(value: number | undefined): number {
  const glyph = Number(value);
  return Number.isInteger(glyph) && glyph >= 0 && glyph < GLYPH_COUNT ? glyph : 0;
}

@action({ UUID: "com.stargate.command.glyph" })
export class StargateGlyph extends SingletonAction<GlyphSettings> {
  override async onWillAppear(ev: WillAppearEvent<GlyphSettings>): Promise<void> {
    const glyph = glyphValue(ev.payload.settings.glyph);
    await ev.action.setImage(`images/glyphs/glyph-${String(glyph).padStart(2, "0")}.svg`);
    await ev.action.setTitle("");
  }

  override async onKeyDown(ev: KeyDownEvent<GlyphSettings>): Promise<void> {
    await sendInput({ type: "glyph", glyph: glyphValue(ev.payload.settings.glyph) });
  }
}

@action({ UUID: "com.stargate.command.enter" })
export class StargateEnter extends SingletonAction {
  override async onKeyDown(): Promise<void> {
    await sendInput({ type: "enter" });
  }
}

@action({ UUID: "com.stargate.command.escape" })
export class StargateEscape extends SingletonAction {
  override async onKeyDown(): Promise<void> {
    await sendInput({ type: "escape" });
  }
}
