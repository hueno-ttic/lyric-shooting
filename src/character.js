const { sortedIndex } = require("textalive-app-api");

/**
 * ネギ（撃ったオブジェクト）クラス．
 * 歌詞と接触した際，歌詞を消したりエフェクトを表示するために使用．
 */
class Negi {
    /**
     * コンストラクタ
     * @param {Number} negi_count 管理用ID．本引数は new する毎に必ずユニークな値を割り振る必要があります．（Element.id 用のIDに用いる為）  
     * @param {String} src_path オブジェクトの画像ファイルパス
     */
    constructor(negi_count, src_path) {
        this.x = 0.0;
        this.y = 0.0;
        this.count = negi_count;
        // ネギオブジェクトの初期設定
        let img = document.createElement('img');
        img.id = this.getId();

        img.src = src_path;

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
        const miku = document.getElementById("miku");
        this.setX(parseInt(miku.style.left, 10) + 0);
        this.setY(parseInt(miku.style.bottom, 10) + miku.height);

    }


    /**
     * 生成したElement削除処理．
     */
    removeDocument() {
        // ネギオブジェクトの削除
        let view = document.getElementById("view");
        if (view != null) {
            const selfNode = document.getElementById(this.getId())
            view.removeChild(selfNode);
        }
    }


    /**
     * Elementが削除済みかの判定．
     * @returns {Boolean} 削除済みの場合 true, 未削除の場合 false を返す
     */
    isRemoved() {
        const view = document.getElementById("view");
        if (view != null) {
            const selfNode = document.getElementById(this.getId())
            return selfNode == null;
        }
        return false;
    }


    /**
     * 更新処理．
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    update(delta) {
        const character = document.getElementById(this.getId());
        if (character == null) {
            return;
        }
        this.setY(this.y + 600 * delta);
    }


    // メンバへのアクセッサ
    /**
     * ドキュメント内 Element アクセス用ID取得．
     * @returns {String} Element アクセス用ID
     */
    getId() {
        return "negi" + this._getCount();
    }


    /**
     * X座標設定（衝突判定用）．この関数で座標をセットすることで描画位置にも反映されます．
     * @param {Number} x X座標
     */
    setX(x) {
        this.x = x;
        this._reflectLeft();
    }


    /**
     * 衝突判定用X座標取得．
     * @returns {Number} X座標
     */
    getX() {
        return this.x;
    }


    /**
     * 描画位置（X軸）更新．
     */
    _reflectLeft() {
        let selfElement = document.getElementById(this.getId());
        selfElement.style.left = this.x - parseFloat(selfElement.width) / 2.0;
    }


    /**
     * 描画用X座標（left) 取得．
     * @returns {Number} X座標
     */
    getLeft() {
        const selfElement = document.getElementById(this.getId());
        return parseInt(selfElement.style.left, 10);
    }


    /**
     * Y座標設定（衝突判定用）．この関数で座標をセットすることで描画位置にも反映されます．
     * @param {Number} y Y座標
     */
    setY(y) {
        this.y = y;
        this._reflectBottom();
    }


    /**
     * 衝突判定用Y座標取得．
     * @returns {Number} Y座標
     */
    getY() {
        return this.y;
    }


    /**
     * 描画位置（Y軸）更新．
     */
    _reflectBottom() {
        let selfElement = document.getElementById(this.getId());
        selfElement.style.bottom = this.y - parseFloat(selfElement.height) / 2.0;
    }


    /**
     * 描画用X座標（bottom) 取得．
     * @returns {Number} Y座標
     */
    getBottom() {
        const selfElement = document.getElementById(this.getId());
        return parseInt(selfElement.style.bottom, 10);
    }


    /**
     * 管理用ID数値．ドキュメントの Element用IDは getId() を使用して取得して下さい．
     * @returns {Number} 管理用ID数値
     */
    _getCount() {
        return this.count;
    }
}


module.exports = Negi;