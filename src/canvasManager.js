import { Point } from "textalive-app-api";

/**
 * ドキュメント内のcanvas管理クラス．
 */
class CanvasManager {
    /**
     * @constructor
     */
    constructor() {
        // キャンバス生成（描画エリア）
        this._can = document.createElement("canvas");
        this._ctx = this._can.getContext("2d");
        document.getElementById("view").append(this._can);

        // キーボードイベント
        document.addEventListener("keydown", (e) => this._keydown(e));

        this._lyrics = [];
        this._negiList = [];
        this.negiSrc = "";
        this._collisionEffectList = [];

        // 漢字判定の正規表現
        this._kanjiRegexp = /([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)/mu;

        // 初期化
        this.initialize();
    }


    /**
     * 実行用初期化処理．
     */
    initialize() {
        // 現在のスクロール位置（画面右上基準）．実質const値．
        this._px = 0;
        this._py = 0;

        // １グリッドの大きさ [px]
        this._space = 160;
        // スクロール速度(BPM:160相当)．アプリ内では使用していない不要変数．
        this.setSpeed(60 * 1000 / 160);
        this._speed = 160;
        // 楽曲の再生位置
        this._position = 0;

        this._lyrics.forEach((lyric) => {
            lyric.initialize();
        });

        // ネギ管理
        this._negiList.forEach((negi) => {
            negi.removeDocument();
        });
        this._negiList = [];
        this._negiCount = 0;

        // エフェクトの管理
        this._collisionEffectList.forEach((effect) => {
            effect.remove();
        });
        this._collisionEffectList = [];
        this._collisionEffectCount = 0;

        // スコア管理
        this._score = 0;
        this.setScoreText(this._score);

        // ミクさんの初期設定
        let miku = document.getElementById("miku");
        miku.src = "pic/miku.gif";
        this._mikuPos = new Point(this._space / 2, 0);
        miku.style.left = this._mikuPos.x;

        this.resize();
    }


    /**
     * 歌詞情報の設定．
     * @param {Lyric[]} lyrics 1曲分の歌詞情報
     */
    setLyrics(lyrics) {
        this._lyrics = lyrics;
    }


    /**
     * スクロール速度の設定．
     * 本来は曲のテンポに合わせ歌詞の落下速度を調整予定でしたがプログラミングコンテスト対象の3曲のみであればこのパラメータの反映をしない方が調整しやすいと判断した為，呼び出しても速度は反映されません．
     * @param {Number} durationMs 
     */
    setSpeed(durationMs) {
        const bpm = 1000.0 / durationMs * 60.0;
        // @todo BPMの上限下限およびバイアス値の調整
        this._speed = 4.0 * clamp(bpm, 20, 360);
    }


    /**
     * 再生位置アップデート．
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    update(position) {
        const delta = (position - this._position) / 1000;
        // @todo this._speed の反映（歌詞，ネギの更新）
        this._updateLyric(delta);
        this._updateNegi(delta);
        this._updateCollisionEffect(delta);

        this._drawBg();
        this._drawLyrics();

        this._position = position;
    }


    /**
     * 歌詞のアップデート．
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    _updateLyric(delta) {
        this._lyrics.forEach((lyric, index) => {
            lyric.update(delta);
        }, (delta));
    }


    /**
     * ネギ（撃ったオブジェクト）のアップデート．
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    _updateNegi(delta) {
        // ネギ更新処理
        this._negiList.forEach((negi, index) => {
            negi.update(delta);
        }, (delta));
        // （デバッグ表示）ネギの衝突判定用描画
        // @todo リリース時は非表示
        this._negiList.forEach((negi, index) => {
            this._ctx.beginPath();
            this._ctx.arc(negi.getX(), window.innerHeight - negi.getY(), 40, 0, 2 * Math.PI)
            this._ctx.stroke();
        });
        // 画面外に出ていたら削除
        this._negiList = this._negiList.filter(negi => {
            if (negi.isRemoved()) {
                return false;
            }

            const ret = negi.getY() < window.innerHeight;
            if (ret == false) {
                negi.removeDocument();
            }
            return ret;
        });
    }


    /**
     * 歌詞とネギ（撃ったオブジェクト）の衝突時エフェクトアップデート．
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    _updateCollisionEffect(delta) {
        this._collisionEffectList.forEach((collisionEffect, index) => {
            collisionEffect.update(delta);
        });
        this._collisionEffectList = this._collisionEffectList.filter(collisionEffect => {
            // @todo 削除判定
            return true;
        });
    }


    /**
     * ウィンドウリサイズ時のコールバック．
     */
    resize() {
        this._can.width = this._stw = document.documentElement.clientWidth;
        this._can.height = this._sth = document.documentElement.clientHeight;
    }


    /**
     * キーボード操作時 "keydown" のコールバック．
     * @param {KeyboardEvent} e キーボードイベント
     */
    _keydown(e) {
        // KeyboardEvent.keyCode は非推奨のパラメータになります．本来は KeyboardEvent.key を使用することが推奨されています．
        // プログラミングコンテスト投稿時はブラウザ Chrome, Edge, Safari かつ QWERTY配列キーボードで動作することのみ確認していました．
        // ミクを動かす
        this.moveMiku(e.keyCode);
        // ネギを投げるか
        this.throwNegi(e.keyCode);
    }


    /**
     * ミクさんの移動処理．
     * @param {Number} key_code 押されたキーの数値コード
     */
    moveMiku(key_code) {
        let miku = document.getElementById("miku");
        // 左ボタン
        if (key_code === 37 && 0 <= parseInt(miku.style.left, 10) - this._space) {
            this._mikuPos.x -= this._space;
        }
        // 右ボタン
        if (key_code === 39 && window.innerWidth > parseInt(miku.style.left, 10) + this._space) {
            this._mikuPos.x += this._space;
        }
        miku.style.left = this._mikuPos.x;
    }


    /**
     * ネギ（撃ったオブジェクト）の生成処理．
     * @param {Number} key_code 押されたキーの数値コード
     */
    throwNegi(key_code) {
        // スペースキーが押されたらネギを投げる
        if (key_code === 32) {

            // 投げるネギの生成
            let Negi = require("./negi.js");
            let src = "";
            if (this.negiSrc != "") {
                src = this.negiSrc;
            } else {
                src = 'pic/negi.png';
            }
            this._negiList.push(new Negi(this._negiCount, src));
            this._negiCount++;
        }
    }


    /**
     * スコア表示更新．
     * @param {Number} score 現在スコア
     */
    setScoreText(score) {
        let scoreElement = document.getElementById("score");
        scoreElement.textContent = "  SCORE : " + score;
    }


    /**
     * 背景の模様描画．
     */
    _drawBg() {
        let ctx = this._ctx;
        ctx.clearRect(0, 0, this._stw, this._sth);
    }


    /**
     * 歌詞の描画．
     * 描画処理内ですが歌詞の位置計算，歌詞とネギ（撃ったオブジェクト）との衝突判定，衝突時処理も行っています．
     */
    _drawLyrics() {
        if (!this._lyrics) return;
        const position = this._position;
        const space = this._space;

        let fontSize = space * 0.5;
        let ctx = this._ctx;
        ctx.textAlign = "center";
        ctx.fillStyle = "#000";

        // 全歌詞を走査
        for (let i = 0, l = this._lyrics.length; i < l; i++) {
            let lyric = this._lyrics[i];
            if (lyric.startTime < position) { // 開始タイム < 再生位置
                if (position < lyric.endTime) { // 再生位置 < 終了タイム
                    if (!lyric.isDraw) {
                        if (lyric.isCollided == false) {
                            lyric.isDraw = true;
                        } else {
                            continue;
                        }

                        // 歌詞出現位置の調整（可能な限り前の単語に続いて横並びで表示させる．フレーズの変わり目の場合は左端から表示させる．）
                        const preLyric = this._lyrics[Math.max(0, i - 1)];
                        const parentWord = lyric.char.parent;
                        const parentPhrase = parentWord.parent;
                        const nextX = Math.floor(-this._px + preLyric.startPos.x + (parentWord.charCount - parentWord.findIndex(lyric.char) + 1) * space);
                        if (nextX < this._stw && parentPhrase.firstChar != lyric.char && 0 < i) {
                            lyric.startPos.x = preLyric.startPos.x + space;
                        } else {
                            lyric.startPos.x = 0;
                        }

                        // グリッド座標の計算
                        const nx = Math.floor((-this._px + lyric.startPos.x) / space);
                        const ny = Math.floor((-this._py + lyric.startPos.y) / space);

                        let tx = 0,
                            ty = 0,
                            isOk = true;

                        // 他の歌詞との衝突判定
                        hitcheck: for (let n = 0; n <= 100; n++) {
                                tx = n;
                                ty = 0;
                                let mx = -1;
                                let my = 1;
                                const rn = (n == 0) ? 1 : n * 4;

                                // 周囲を走査
                                for (let r = 0; r < rn; r++) {
                                    isOk = true;
                                    for (let j = 0; j < i; j++) {
                                        const tl = this._lyrics[j];

                                        // 他の歌詞と衝突している
                                        if (tl.isDraw && tl.pos.x == nx + tx && tl.pos.y == ny + ty) {
                                            isOk = false;
                                            break;
                                        }
                                    }
                                    if (isOk) break hitcheck;

                                    // 次のグリッドへ
                                    tx += mx;
                                    if (tx == n || tx == -n) mx = -mx;
                                    ty += my;
                                    if (ty == n || ty == -n) my = -my;
                                }
                            }
                        // グリッド座標をセット＆描画を有効に
                        lyric.pos.x = nx + tx;
                        lyric.pos.y = ny + ty;
                    }
                }

                // 描画が有効な場合、歌詞を描画する
                if (lyric.isDraw) {
                    let px = lyric.pos.x * space;
                    let py = lyric.pos.y * space;

                    // 文字が画面外にある場合は除外
                    if (px + space < -this._px || -this._px + this._stw < px) continue;
                    if (py + space < -this._py || -this._py + this._sth < py) continue;

                    px = this._px + px + space / 2;
                    py = this._py + py + space / 2;


                    // 衝突判定 
                    this._collisionNegiAndLyric(lyric, px, py);

                    const prog = this._easeOutBack(Math.min((position - lyric.startTime) / 200, 1));

                    if (lyric.text.match(this._kanjiRegexp)) {
                        ctx.fillStyle = '#FF0000';
                    } else {
                        ctx.fillStyle = '#000000';
                    }

                    fontSize = space * 0.5 * prog;
                    ctx.font = "bold " + fontSize + "px sans-serif";
                    ctx.fillText(lyric.text, px, py + fontSize * 0.37);
                }
            } else lyric.isDraw = false;
        }
    }


    /** 
     *  歌詞とネギとの衝突判定
     */
    _collisionNegiAndLyric(lyric, px, py) {
        for (let j = 0; j < this._negiList.length; j++) {
            let negi = this._negiList[j];
            if (negi.isRemoved()) {
                continue;
            }
            const negi_x = negi.getX();
            const negi_y = window.innerHeight - negi.getY();
            // あたり判定
            if (lyric.isCollided == false && negi_x >= px - 40 && negi_x <= px + 40 &&
                negi_y >= py - 40 && negi_y <= py + 40) {
                // スコアの更新
                if (lyric.text.match(this._kanjiRegexp)) {
                    this._score += 1000;
                } else {
                    this._score += 100;
                }
                this.setScoreText(this._score);

                lyric.isCollided = true;
                lyric.isDraw = false;
                negi.removeDocument();

                // 当たったのエフェクト追加
                let CollisionEffect = require("./collisionEffect.js");
                this._collisionEffectList.push(new CollisionEffect(negi.getX(), negi.getY(), this._collisionEffectCount));
                this._collisionEffectCount++;
            }
        }


    }

    _easeOutBack(x) { return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); }
}


/**
 * 値を上限および下限値の範囲内に収めた値として取得．
 * @param {Number} val 値
 * @param {Number} min 上限値
 * @param {Number} max 下限値
 * @returns {Number} [min, max] 区間内におけるvalの近似値
 */
function clamp(val, min, max) {
    if (max < min) {
        const t = min;
        min = max;
        max = t;
    }
    return Math.min(max, Math.max(min, val));
}


module.exports = CanvasManager;