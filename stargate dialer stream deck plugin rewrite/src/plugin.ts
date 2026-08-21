import streamDeck from "@elgato/streamdeck";
import { StargateEnter, StargateEscape, StargateGlyph } from "./actions/stargate-actions";

streamDeck.logger.setLevel("info");
streamDeck.actions.registerAction(new StargateGlyph());
streamDeck.actions.registerAction(new StargateEnter());
streamDeck.actions.registerAction(new StargateEscape());
streamDeck.connect();
