import { Player, Point, stringToDataUrl } from "textalive-app-api";

/**
 * 
 * 歌詞を撃ち落としてスコアを競うノスタルジック溢れるシューティングゲーム
 * 
 */

// 再生用動画URL
 var music_url;

 /**
  * TextAliveAPI用初期化処理，インスタンス生成，コールバック登録用クラス．
  */
class Main {
    /**
     * @constructor
     */
    constructor() {
        var canMng = new CanvasManager();
        this._canMng = canMng;

        this._initPlayer();

        window.addEventListener("resize", () => this._resize());
        this._update();

        this._duration = 0;
        this._position = 0;
    }


    /**
     * TextAliveAPI Player初期化．
     */
    _initPlayer() {
        var player = new Player({
            app: {
                appAuthor: "TTIC",
                appName: "Lyric Shooting!!",
                valenceArousalEnabled: true
            },
            mediaElement: document.querySelector("#media")
        });

        player.addListener({
            onAppReady: (app) => this._onAppReady(app),
            onVideoReady: (v) => this._onVideoReady(v),
            onTimerReady: (timer) => this._onTimerReady(timer),
            onTimeUpdate: (pos) => this._onTimeUpdate(pos),
        });
        this._player = player;
    }


    /**
     * アプリ準備完了（TextAliveホスト接続時のコールバック）．
     * @param {IPlayerApp} app TextAliveAPI アプリ情報
     */
    _onAppReady(app) {
        if (!app.songUrl) {
            this._player.createFromSongUrl(music_url);
        }

        // ボタンクリック時の処理
        document.querySelector("#control").style.display = "block";
        // 再生
        document.getElementById("play").addEventListener("click", () => function(player, canMng, main) {
            // 最後まで再生済みの場合は最初から再生
            if (main._duration <= main._position) {
                player.requestMediaSeek(0);
                canMng.initialize();
            }
            player.requestPlay();
        }(this._player, this._canMng, this));
        // 一時停止
        document.querySelector("#pause").addEventListener("click", () => function(player) {
            player.requestPause();
        }(this._player));
        // 最初から
        document.querySelector("#rewind").addEventListener("click", () => function(player, canMng) {
            player.requestMediaSeek(0);
            canMng.initialize();
        }(this._player, this._canMng));
    }


    /**
     * ビデオ準備完了（動画オブジェクト準備完了時のコールバック）．
     * @param {IVideo} v TextAliveAPI 動画オブジェクト
     */
    _onVideoReady(v) {
        // 歌詞のセットアップ
        var lyrics = [];
        // 歌詞を単語単位で左端から表示するよう座標を仮設定
        // CanvasManager::_drawLyrics() にて表示する際，ウィンドウ内に収まれば左端から表示しないよう座標の調整を行う
        if (v.firstWord) {
            var word = v.firstWord;
            while (word) {
                var lyricChar = word.firstChar;
                for (let i = 0; i < word.charCount; i++) {
                    lyrics.push(new Lyric(lyricChar, new Point(i * 160, 80)));
                    lyricChar = lyricChar.next;
                }
                word = word.next;
            }
        }
        this._canMng.setLyrics(lyrics);
        this._duration = v.duration;
    }


    /**
     * 再生準備完了（動画再生の為の Timer 準備完了時のコールバック）．
     * @param {Timer} timer TextAliveAPI タイマーオブジェクト
     */
    _onTimerReady(timer) {
        // ボタンを有効化する
        document.querySelectorAll("button")
            .forEach((btn) => (btn.disabled = false));
    }


    /**
     * 再生位置アップデート（動画再生位置変更時のコールバック）．
     * @param {Number} position 動画再生位置[ms]
     */
    _onTimeUpdate(position) {
        this._position = position;
        this._updateTime = Date.now();
        this._canMng.update(position);

        // キャラチェンジ演出（背景，プレイヤー操作のミクさん，撃つオブジェクトの切り替え）
        // サビの場合：マジカルミライ2020衣装のミクさんが扇を撃つ
        // サビ以外の場合：通常衣装のミクさんがネギを撃つ
        if (this._player.findChorus(position) != null) {
            var miku = document.getElementById("miku");
            if (miku.src.includes("pic/miku.gif")) {

                miku.src = "pic/2020miku.gif";
                this._canMng.negiSrc = "pic/ogi.png";
                var body = document.getElementById("body");
                body.background = "pic/wall2020miku.png";
            }

        } else {
            var miku = document.getElementById("miku");
            if (!miku.src.includes("pic/miku.gif")) {

                miku.src = "pic/miku.gif ";
                this._canMng.negiSrc = "pic/negi.png";
                var body = document.getElementById("body");
                body.background = "pic/wallmiku.png";
            }
        }
    }


    /**
     * 更新処理．
     */
    _update() {
        if (this._player.isPlaying && 0 <= this._updateTime && 0 <= this._position) {
            var t = (Date.now() - this._updateTime) + this._position;
            this._updateSpeed(t);
            this._canMng.update(t);
        }
        window.requestAnimationFrame(() => this._update());
    }


    /**
     * 楽曲速度の更新．
     * 曲の速度によって歌詞の落下速度を調整する予定でしたがプログラミングコンテスト投稿時はCanvasManager側でパラメータを反映させていない為，無意味な関数となっています．
     * @param {Number} position 動画再生位置[ms]
     */
    _updateSpeed(position) {
        // ビートに合わせて移動速度の設定
        var beat = this._player.findBeat(position);
        if (beat) {
            this._canMng.setSpeed(beat.duration);
        }
    }


    /**
     * ウィンドウリサイズ時のコールバック．
     */
    _resize() {
        this._canMng.resize();
    }
}


/**
 * 歌詞（1文字）クラス．
 */
class Lyric {
    /**
     * @constructor
     * @param {IChar} data TextAliveAPI 歌詞情報（1文字）
     * @param {Number} startPos 歌詞再生開始タイミング[ms]．IChar.startTimeから取得できる為，実質不要な引数．
     */
    constructor(data, startPos) {
        this.char = data; // 歌詞データ
        this.text = data.text; // 歌詞文字
        this.startTime = data.startTime; // 開始タイム [ms]
        this.endTime = data.endTime; // 終了タイム [ms]
        this.duration = data.duration; // 開始から終了迄の時間 [ms]
        this.startPos = startPos;

        this.initialize();
    }


    /**
     * 最初から実行用初期化処理．
     */
    initialize() {
        this.pos = new Point(0, 0); // グリッドの座標
        this.isDraw = false; // 描画するかどうか
        this.isCollided = false; // 衝突済みかどうか
    }


    /**
     * 更新処理．
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    update(delta) {
        this.pos.y += delta;
    }
}


/**
 * Lyric及びNegi衝突時のエフェクトクラス．
 */
class CollisionEffect {
    /**
     * @constructor
     * @param {Number} x 描画時のX座標．（Element.style.leftにて表示位置を指定する用）
     * @param {Number} y 描画時のY座標．（Element.style.bottomにて表示位置を指定する用）
     * @param {Number} effect_count 管理用ID．本引数は new する毎に必ずユニークな値を割り振る必要があります．（Element.id 用のIDに用いる為）
     */
    constructor(x, y, effect_count) {
        this.effect_count = effect_count;
        this.img = document.createElement('img');
        this.img.id = "star" + this.effect_count;

        this.time_count = 0;

        this.img.src = 'pic/star.gif';
        // イメージの大きさ
        this.img.width = "100";
        this.img.height = "100";

        // スタイルの初期化
        this.img.style.position = "absolute";
        this.img.style.left = x - 40;
        this.img.style.bottom = y;

        // viewに爆発オブジェクトを追加
        document.getElementById("view").appendChild(this.img);
    }


    /**
     * 更新処理．
     * 後で同名の関数 update() が定義されておりそちらが使われる為，不使用関数．
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    update(delta) {
        // @todo エフェクトの再生処理
    }


    /**
     * 削除処理．
     */
    remove() {
        var view = document.getElementById("view");
        if (view != null) {
            var selfNode = document.getElementById(this.getId());
            if (selfNode) {
                view.removeChild(selfNode);
                delete this;
            }
        }
    }


    /**
     * 更新処理．
     */
    update() {
        this.time_count++;
        if (this.time_count >= 30) {
            this.remove(this.getId());
        }
    }


    /**
     * ドキュメント内 Element アクセス用ID取得．
     * @returns {String} Element アクセス用ID
     */
    getId() {
        return "star" + this.effect_count;
    }
}


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

        // マウス（タッチ）イベント
        document.addEventListener("mousemove", (e) => this._move(e));
        document.addEventListener("mouseleave", (e) => this._leave(e));
        if ("ontouchstart" in window) {
            // グリッドの大きさ／スクロール速度半分
            this._space *= 0.1;
            this._speed *= 0.1;
            document.addEventListener("touchmove", (e) => this._move(e));
            document.addEventListener("touchend", (e) => this._leave(e));
        }
        document.addEventListener("keydown", (e) => this._keydown(e));

        this._lyrics = [];
        this._negiList = [];
        this.negiSrc = "";
        this._collisionEffectList = [];

        this.initialize();
    }


    /**
     * 最初から実行用初期化処理．
     */
    initialize() {
        // 現在のスクロール位置（画面右上基準）．実質const値．
        this._px = 0;
        this._py = 0;
        // マウス位置（中心が 0, -1 ~ 1 の範囲に正規化された値）．アプリ内では使用していない不要変数．
        this._rx = 0;
        this._ry = 0;

        // １グリッドの大きさ [px]
        this._space = 160;
        // スクロール速度(BPM:160相当)．アプリ内では使用していない不要変数．
        this.setSpeed(60 * 1000 / 160);
        this._speed = 160;
        // 楽曲の再生位置
        this._position = 0;
        // マウスが画面上にあるかどうか（画面外の場合 false）．アプリ内では使用していない不要変数．
        this._isOver = false;

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
        var miku = document.getElementById("miku");
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
        var bpm = 1000.0 / durationMs * 60.0;
        // @todo BPMの上限下限およびバイアス値の調整
        this._speed = 4.0 * clamp(bpm, 20, 360);
    }


    /**
     * 再生位置アップデート．
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    update(position) {
        var delta = (position - this._position) / 1000;
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

            var ret = negi.getY() < window.innerHeight;
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
     * マウス操作時 "mousemove" / "touchmove" のコールバック．
     * 本アプリではマウス操作時のパラメータは使用していない為，本来は不要の処理になります．
     * @param {MouseEvent} e マウスイベント
     */
    _move(e) {
        var mx = 0;
        var my = 0;

        if (e.touches) {
            mx = e.touches[0].clientX;
            my = e.touches[0].clientY;
        } else {
            mx = e.clientX;
            my = e.clientY;
        }
        this._mouseX = mx;
        this._mouseY = my;

        this._rx = (mx / this._stw) * 2 - 1;
        this._ry = (my / this._sth) * 2 - 1;

        this._isOver = true;
    }


    /**
     * マウス操作時 "mouseleave" / "touchend" のコールバック．
     * 本アプリではマウス操作時のパラメータは使用していない為，本来は不要の処理になります．
     * @param {MouseEvent} e マウスイベント
     */
    _leave(e) {
        this._isOver = false;
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
        var miku = document.getElementById("miku");
        // parseIntの引数 radix が省略されていますが 10 を指定するのが望ましいです
        // 左ボタン
        if (key_code === 37 && 0 <= parseInt(miku.style.left) - this._space) {
            this._mikuPos.x -= this._space;
        }
        // 右ボタン
        if (key_code === 39 && window.innerWidth > parseInt(miku.style.left) + this._space) {
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
            let Negi = require("./character");
            var src = "";
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
        var scoreElement = document.getElementById("score");
        scoreElement.textContent = "  SCORE : " + score;
    }


    /**
     * 不使用関数．
     */
    _isKanji() {
        return true;
    }


    /**
     * 背景の模様描画．
     */
    _drawBg() {
        var space = this._space;

        var ox = this._px % space;
        var oy = this._py % space;

        var nx = this._stw / space + 1;
        var ny = this._sth / space + 1;

        var ctx = this._ctx;
        ctx.clearRect(0, 0, this._stw, this._sth);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (var y = 0; y <= ny; y++) {
            for (var x = 0; x <= nx; x++) {
                var tx = x * space + ox;
                var ty = y * space + oy;
            }
        }
        ctx.stroke();
    }


    /**
     * 歌詞の描画．
     * 描画処理内ですが歌詞の位置計算，歌詞とネギ（撃ったオブジェクト）との衝突判定，衝突時処理も行っています．
     */
    _drawLyrics() {
        if (!this._lyrics) return;
        var position = this._position;
        var space = this._space;

        var fontSize = space * 0.5;
        var ctx = this._ctx;
        ctx.textAlign = "center";
        ctx.fillStyle = "#000";

        // 全歌詞を走査
        for (var i = 0, l = this._lyrics.length; i < l; i++) {
            var lyric = this._lyrics[i];
            if (lyric.startTime < position) { // 開始タイム < 再生位置
                if (position < lyric.endTime) { // 再生位置 < 終了タイム
                    if (!lyric.isDraw) {
                        if (lyric.isCollided == false) {
                            lyric.isDraw = true;
                        } else {
                            continue;
                        }

                        // 歌詞出現位置の調整（可能な限り前の単語に続いて横並びで表示させる．フレーズの変わり目の場合は左端から表示させる．）
                        var preLyric = this._lyrics[Math.max(0, i - 1)];
                        var parentWord = lyric.char.parent;
                        var parentPhrase = parentWord.parent;
                        var nextX = Math.floor(-this._px + preLyric.startPos.x + (parentWord.charCount - parentWord.findIndex(lyric.char) + 1) * space);
                        if (nextX < this._stw && parentPhrase.firstChar != lyric.char && 0 < i) {
                            lyric.startPos.x = preLyric.startPos.x + space;
                        } else {
                            lyric.startPos.x = 0;
                        }

                        // グリッド座標の計算
                        var nx = Math.floor((-this._px + lyric.startPos.x) / space);
                        var ny = Math.floor((-this._py + lyric.startPos.y) / space);

                        var tx = 0,
                            ty = 0,
                            isOk = true;

                        // 他の歌詞との衝突判定
                        hitcheck: for (var n = 0; n <= 100; n++) {
                                tx = n;
                                ty = 0;
                                var mx = -1;
                                var my = 1;
                                var rn = (n == 0) ? 1 : n * 4;

                                // 周囲を走査
                                for (var r = 0; r < rn; r++) {
                                    isOk = true;
                                    for (var j = 0; j < i; j++) {
                                        var tl = this._lyrics[j];

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
                    var px = lyric.pos.x * space;
                    var py = lyric.pos.y * space;

                    // 文字が画面外にある場合は除外
                    if (px + space < -this._px || -this._px + this._stw < px) continue;
                    if (py + space < -this._py || -this._py + this._sth < py) continue;

                    px = this._px + px + space / 2;
                    py = this._py + py + space / 2;


                    // 衝突判定 
                    for (let j = 0; j < this._negiList.length; j++) {
                        var negi = this._negiList[j];
                        if (negi.isRemoved()) {
                            continue;
                        }
                        var negi_x = negi.getX();
                        var negi_y = window.innerHeight - negi.getY();
                        // あたり判定
                        if (lyric.isCollided == false && negi_x >= px - 40 && negi_x <= px + 40 &&
                            negi_y >= py - 40 && negi_y <= py + 40) {
                            // スコアの更新
                            var regexp = /([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)/mu;
                            if (lyric.text.match(regexp)) {
                                this._score += 1000;
                            } else {
                                this._score += 100;
                            }
                            this.setScoreText(this._score);

                            lyric.isCollided = true;
                            lyric.isDraw = false;
                            negi.removeDocument();

                            // 当たったのエフェクト追加
                            this._collisionEffectList.push(new CollisionEffect(negi.getX(), negi.getY(), this._collisionEffectCount));
                            this._collisionEffectCount++;
                        }
                    }
                    var prog = this._easeOutBack(Math.min((position - lyric.startTime) / 200, 1));

                    var regexp = /([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)/mu;
                    if (lyric.text.match(regexp)) {
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
        var t = min;
        min = max;
        max = t;
    }
    return Math.min(max, Math.max(min, val));
}


// ---- 以下，選曲時のボタン処理 ----
// 愛されなくても君がいる
document.getElementById("ygY2qObZv24").onclick = function() {
    music_url = "http://www.youtube.com/watch?v=ygY2qObZv24";
    selectMusicDone();
    new Main()
};


// ブレス・ユア・ブレス
document.getElementById("a-Nf3QUFkOU").onclick = function() {
    music_url = "http://www.youtube.com/watch?v=a-Nf3QUFkOU";
    selectMusicDone();
    new Main()
};


// グリーンライツ・セレナーデ
document.getElementById("XSLhsjepelI").onclick = function() {
    music_url = "http://www.youtube.com/watch?v=XSLhsjepelI";
    selectMusicDone();
    new Main()
};


function selectMusicDone() {
    document.getElementById("ygY2qObZv24").style.display = "none";
    document.getElementById("a-Nf3QUFkOU").style.display = "none";
    document.getElementById("XSLhsjepelI").style.display = "none";
    document.getElementById("play_img").style.display = "none";

    var score = document.createElement("font");
    score.size = 20;
    score.id = "score";
    score.textContent = "SCORE : 0";

    document.getElementById("view").appendChild(score);
}