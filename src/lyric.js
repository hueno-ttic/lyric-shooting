import { Player, Point, stringToDataUrl } from "textalive-app-api";

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

module.exports = Lyric;