import { Player, Point, stringToDataUrl } from "textalive-app-api";

/**
 * 
 * マウスに追従して歌詞が表示されるデモ
 * 
 */
class Main {
    constructor() {
        var canMng = new CanvasManager();
        this._canMng = canMng;

        this._initPlayer();

        window.addEventListener("resize", () => this._resize());
        this._update();
    }

    // プレイヤー初期化
    _initPlayer() {
        var player = new Player({
            app: {
                appAuthor: "TTIC",
                appName: "Lyric Shooting!!"
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

    // アプリ準備完了
    _onAppReady(app) {
        if (!app.songUrl) {
            //this._player.createFromSongUrl("https://www.youtube.com/watch?v=-6oxY-quTOA");
            this._player.createFromSongUrl("http://www.youtube.com/watch?v=XSLhsjepelI");
        }

        // ボタンクリック時の処理
        document.querySelector("#control").style.display = "block";
        // 再生
        document.getElementById("play").addEventListener("click", () => function(player) {
            player.requestPlay();
            console.log("button:play");
        }(this._player));
        // 頭出し
        document.querySelector("#cueing").addEventListener("click", () => function(player) {
            player.requestMediaSeek(player.video.firstChar.startTime);
        }(this._player));
        // 一時停止
        document.querySelector("#pause").addEventListener("click", () => function(player) {
            player.requestPause();
        }(this._player));

        // 画面クリックで再生／一時停止
        document.getElementById("view").addEventListener("click", () => function(player) {
            if (player.isPlaying) {
                player.requestPause();
            } else {
                player.requestPlay();
            }
        }(this._player));
    }

    // ビデオ準備完了
    _onVideoReady(v) {
        // 歌詞のセットアップ
        var lyrics = [];
        // @todo 表示歌詞の調整．フレーズ単位で横に並べると画面外に出るので単語単位でいい感じの区切り方にしたい．
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
    }

    // 再生準備完了
    _onTimerReady(timer) {
        // ボタンを有効化する
        document.querySelectorAll("button")
            .forEach((btn) => (btn.disabled = false));
    }

    // 再生位置アップデート
    _onTimeUpdate(position) {
        this._position = position;
        this._updateTime = Date.now();
        this._canMng.update(position);
    }

    _update() {
        if (this._player.isPlaying && 0 <= this._updateTime && 0 <= this._position) {
            var t = (Date.now() - this._updateTime) + this._position;
            this._updateSpeed(t);
            this._canMng.update(t);
        }
        window.requestAnimationFrame(() => this._update());
    }

    _updateSpeed(position) {
        // ビートに合わせて移動速度の設定
        var beat = this._player.findBeat(position);
        if (beat) {
            this._canMng.setSpeed(beat.duration);
        }
    }

    _resize() {
        this._canMng.resize();
    }
}

/**
 * 歌詞（1文字）クラス．
 */
class Lyric {
    constructor(data, startPos) {
        this.char = data; // 歌詞データ
        this.text = data.text; // 歌詞文字
        this.startTime = data.startTime; // 開始タイム [ms]
        this.endTime = data.endTime; // 終了タイム [ms]
        this.duration = data.duration; // 開始から終了迄の時間 [ms]

        this.pos = new Point(0, 0); // グリッドの座標 x
        this.startPos = startPos;
        this.isDraw = false; // 描画するかどうか
    }

    update(delta) {
        this.pos.y += delta;
    }
}


/**
 * 衝突判定用
 */

class collisionEffect {

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

        console.log(this.img);
        // viewに爆発オブジェクトを追加
        document.getElementById("view").appendChild(this.img);
    }

    update(delta) {
        // @todo エフェクトの再生処理
    }

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
    update() {
        this.time_count++;
        if (this.time_count >= 30) {
            this.remove(this.getId());
        }

    }

    getId() {
        return "star" + this.effect_count;
    }

}


class CanvasManager {
    constructor() {
        // 現在のスクロール位置（画面右上基準）
        this._px = 0;
        this._py = 0;
        // マウス位置（中心が 0, -1 ~ 1 の範囲に正規化された値）
        this._rx = 0;
        this._ry = 0;

        // １グリッドの大きさ [px]
        this._space = 160;
        // スクロール速度(BPM:160相当)
        this.setSpeed(60 * 1000 / 160);
        this._speed = 160;
        // 楽曲の再生位置
        this._position = 0;
        // マウスが画面上にあるかどうか（画面外の場合 false）
        this._isOver = false;

        // ネギ管理
        this._negiList = [];
        this._negiCount = 0;

        // エフェクトの管理
        this._collisionEffectList = [];
        this._collisionEffectCount = 0;

        // スコア管理
        this._score = 0;

        var miku = document.getElementById("miku");
        this._mikuPos = new Point(this._space / 2, 0);
        miku.style.left = this._mikuPos.x;

        // キャンバス生成（描画エリア）
        this._can = document.createElement("canvas");
        this._ctx = this._can.getContext("2d");
        document.getElementById("view").append(this._can);

        // マウス（タッチ）イベント
        document.addEventListener("mousemove", (e) => this._move(e));
        //console.log("マウス位置：" + this._move);
        document.addEventListener("mouseleave", (e) => this._leave(e));
        if ("ontouchstart" in window) {
            // グリッドの大きさ／スクロール速度半分
            this._space *= 0.1;
            this._speed *= 0.1;
            document.addEventListener("touchmove", (e) => this._move(e));
            document.addEventListener("touchend", (e) => this._leave(e));
        }
        document.addEventListener("keydown", (e) => this._keydown(e));

        this.resize();
    }

    // 歌詞の更新
    setLyrics(lyrics) {
        this._lyrics = lyrics;
    }

    // スクロール速度の更新
    setSpeed(durationMs) {
        var bpm = 1000.0 / durationMs * 60.0;
        //console.log("bpm:"+bpm);
        // @todo BPMの上限下限およびバイアス値の調整
        this._speed = 4.0 * clamp(bpm, 20, 360);
    }

    // 再生位置アップデート
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

    // 歌詞のアップデート
    _updateLyric(delta) {
        this._lyrics.forEach((lyric, index) => {
            lyric.update(delta);
        }, (delta));
    }

    // ネギのアップデート
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

    // 歌詞とネギの衝突時エフェクトアップデート
    _updateCollisionEffect(delta) {
        this._collisionEffectList.forEach((collisionEffect, index) => {
            collisionEffect.update(delta);
        });
        this._collisionEffectList = this._collisionEffectList.filter(collisionEffect => {
            // @todo 削除判定
            return true;
        });
    }

    // リサイズ
    resize() {
        this._can.width = this._stw = document.documentElement.clientWidth;
        this._can.height = this._sth = document.documentElement.clientHeight;
    }

    // "mousemove" / "touchmove"
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

    // "mouseleave" / "touchend"
    _leave(e) {
        this._isOver = false;
    }

    // "keydown"
    _keydown(e) {
        // ミクを動かす
        this.moveMiku(e.keyCode);
        // ネギを投げるか
        this.throwNegi(e.keyCode);
    }

    moveMiku(key_code) {
        var miku = document.getElementById("miku");
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
    throwNegi(key_code) {
        // スペースキーが押されたらネギを投げる
        if (key_code === 32) {

            // 投げるネギの生成
            let Negi = require("./character");
            var src = "";
            if (this._score > 50000) {
                src = 'pic/ogi.png';
            } else {
                src = 'pic/negi.png';
            }
            this._negiList.push(new Negi(this._negiCount, src));
            this._negiCount++;
        }
    }

    _isKanji() {
        return true;

    }

    // 背景の模様描画
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

                // 十字の模様描画
                ctx.moveTo(tx - 8, ty);
                ctx.lineTo(tx + 8, ty);
                ctx.moveTo(tx, ty - 8);
                ctx.lineTo(tx, ty + 8);
            }
        }
        ctx.stroke();
    }

    // 歌詞の描画
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
                    if (!isNaN(this._mouseX) && !lyric.isDraw) {
                        if (lyric.text != "") {
                            lyric.isDraw = true;
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


                    // 衝突判定 //////////////////////////////////////
                    for (let j = 0; j < this._negiList.length; j++) {
                        //console.log("negiLen;"+this._negiList.length);
                        var negi = this._negiList[j];
                        if (negi.isRemoved()) {
                            continue;
                        }
                        var negi_x = negi.getX();
                        var negi_y = window.innerHeight - negi.getY();
                        // あたり判定
                        if (lyric.text != "" && negi_x >= px - 40 && negi_x <= px + 40 &&
                            negi_y >= py - 40 && negi_y <= py + 40) {


                            // スコアの更新
                            var score = document.getElementById("score");
                            var regexp = /([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)/mu;
                            if (lyric.text.match(regexp)) {
                                this._score += 1000;
                            } else {
                                this._score += 100;
                            }
                            score.textContent = "  SCORE : " + this._score;

                            lyric.text = "";
                            lyric.isDraw = false;
                            negi.removeDocument();

                            // 当たったのエフェクト追加
                            this._collisionEffectList.push(new collisionEffect(negi.getX(), negi.getY(), this._collisionEffectCount));
                            this._collisionEffectCount++;

                            // キャラチェンジ演出
                            if (this._score > 50000) {
                                var miku = document.getElementById("miku");
                                miku.src = "pic/2020miku.gif";
                            }

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

function clamp(val, min, max) {
    if (max < min) {
        var t = min;
        min = max;
        max = t;
    }
    return Math.min(max, Math.max(min, val));
}

new Main()