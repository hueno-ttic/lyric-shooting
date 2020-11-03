const { sortedIndex } = require("textalive-app-api");

/**
 * ネギクラス．
 * 歌詞と接触した際，歌詞を消したりエフェクトを表示するために使用．
 */
class Negi {
    /**
     * コンストラクタ
     * @param {int} negi_count 管理用ID．negi_count は new する毎に必ずユニークな値を割り振る必要があります．Element.id 用のIDに用いる為．  
     */
    constructor(negi_count) {
        this.x = 0.0;
        this.y = 0.0;
        this.count = negi_count;
        // ネギオブジェクトの初期設定
        var img = document.createElement('img');
        img.id = this.getId();

        img.src = 'pic/ogi.png';

        // イメージの大きさ
        img.width = "100";
        img.height = "150";

        // スタイルの初期化
        img.style.position = "absolute";

        // viewにネギオブジェクトを追加
        if (document.getElementById("view")) {
            document.getElementById("view").appendChild(img);
        }

        // ネギの初期生成位置
        // @todo ミクさんのネギ位置に合わせた微調整
        var miku = document.getElementById("miku");
        this.setX(parseInt(miku.style.left) + 0);
        this.setY(parseInt(miku.style.bottom) + miku.height);

    }

    /**
     * 生成したElement削除処理．
     */
    removeDocument() {
        // ネギオブジェクトの削除
        var view = document.getElementById("view");
        if (view != null) {
            console.log("delete:" + this.getId());
            var selfNode = document.getElementById(this.getId())
            view.removeChild(selfNode);
        }
    }

    /**
     * Elementが削除済みかの判定．
     * @returns {Boolean}
     */
    isRemoved() {
        var view = document.getElementById("view");
        if (view != null) {
            var selfNode = document.getElementById(this.getId())
            return selfNode == null;
        }
        return false;
    }

    /**
     * 更新処理．
     * @param {Number} delta 前回呼び出し時からのposiiton差分
     */
    update(delta) {
        var character = document.getElementById(this.getId());
        if (character == null) {
            return;
        }
        this.setY(this.y + 600 * delta);
    }

    // メンバへのアクセッサ
    getId() {
        return "negi" + this._getCount();
    }
    setX(x) {
        this.x = x;
        this._reflectLeft();
    }
    getX() {
        return this.x;
    }
    _reflectLeft() {
        var selfElement = document.getElementById(this.getId());
        selfElement.style.left = this.x - parseFloat(selfElement.width) / 2.0;
    }
    getLeft() {
        var selfElement = document.getElementById(this.getId());
        return parseInt(selfElement.style.left);
    }
    setY(y) {
        this.y = y;
        this._reflectBottom();
    }
    getY() {
        return this.y;
    }
    _reflectBottom() {
        var selfElement = document.getElementById(this.getId());
        selfElement.style.bottom = this.y - parseFloat(selfElement.height) / 2.0;
    }
    getBottom() {
        var selfElement = document.getElementById(this.getId());
        return parseInt(selfElement.style.bottom);
    }

    _getCount() {
        return this.count;
    }
}

module.exports = Negi;