/* @ts-self-types="./syllabify_fr_wasm.d.ts" */
import * as wasm from "./syllabify_fr_wasm_bg.wasm";
import { __wbg_set_wasm } from "./syllabify_fr_wasm_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    phonemes, renderHtml, renderWordHtml, syllabifyText, syllables
} from "./syllabify_fr_wasm_bg.js";
