import { Player, Point } from "textalive-app-api";
import pic from './pic/*.*';

/**
 * 
 * 歌詞を撃ち落としてスコアを競うノスタルジック溢れるシューティングゲーム
 * 
 */

/**
 * TextAliveAPI用初期化処理，インスタンス生成，コールバック登録用クラス．
 */
class MainLogic {
    /**
     * @constructor
     */
    constructor(music_url) {
        const CanvasManager = require("./canvasManager.js");
        const canMng = new CanvasManager();
        this._canMng = canMng;

        this._music_url = music_url;
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
        let player = new Player({
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
            this._player.createFromSongUrl(this._music_url);
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
        let lyrics = [];　　
        const Lyric = require("./lyric.js");

        // 歌詞を単語単位で左端から表示するよう座標を仮設定
        // CanvasManager::_drawLyrics() にて表示する際，ウィンドウ内に収まれば左端から表示しないよう座標の調整を行う
        if (v.firstWord) {
            let word = v.firstWord;
            while (word) {
                let lyricChar = word.firstChar;
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
        console.log(this._player.findChorus(position));
        if (this._player.findChorus(position) != null) {
            let miku = document.getElementById("miku");
            if (miku.src.includes(pic["miku"]["gif"])) {

                miku.src = pic["2020miku"]["gif"];
                this._canMng.negiSrc = pic["ogi"]["png"];
                let body = document.getElementById("body");
                body.background = pic["wall2020miku"]["png"];
            }

        } else {
            let miku = document.getElementById("miku");
            if (!miku.src.includes(pic["miku"]["gif"])) {

                miku.src = pic["miku"]["gif"];
                this._canMng.negiSrc = pic["negi"]["png"];
                let body = document.getElementById("body");
                body.background = pic["wallmiku"]["png"];
            }
        }
    }


    /**
     * 更新処理．
     */
    _update() {
        if (this._player.isPlaying && 0 <= this._updateTime && 0 <= this._position) {
            const t = (Date.now() - this._updateTime) + this._position;
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
        const beat = this._player.findBeat(position);
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


// ---- 以下，選曲時のボタン処理 ----

// 再生用動画URL
var music_url;

// 愛されなくても君がいる
document.getElementById("ygY2qObZv24").onclick = function() {
    music_url = "http://www.youtube.com/watch?v=ygY2qObZv24";
    selectMusicDone();
    new MainLogic(music_url);
};


// ブレス・ユア・ブレス
document.getElementById("a-Nf3QUFkOU").onclick = function() {
    music_url = "http://www.youtube.com/watch?v=a-Nf3QUFkOU";
    selectMusicDone();
    new MainLogic(music_url);
};


// グリーンライツ・セレナーデ
document.getElementById("XSLhsjepelI").onclick = function() {
    music_url = "http://www.youtube.com/watch?v=XSLhsjepelI";
    selectMusicDone();
    new MainLogic(music_url);
};


function selectMusicDone() {
    document.getElementById("ygY2qObZv24").style.display = "none";
    document.getElementById("a-Nf3QUFkOU").style.display = "none";
    document.getElementById("XSLhsjepelI").style.display = "none";
    document.getElementById("play_img").style.display = "none";

    let score = document.createElement("font");
    score.size = 20;
    score.id = "score";
    score.textContent = "SCORE : 0";

    document.getElementById("view").appendChild(score);
}