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
     * @param {Number} delta 前回呼び出し時からの時間差分[ms]
     */
    update(delta) {
        // @todo エフェクトの再生処理
        // 本来はこちらで処理落ち対応で delta を考慮して remove() すべきですが，コンテスト時の挙動から変えない為 update() の処理をこちら側へそのまま引用
        this.time_count++;
        if (this.time_count >= 30) {
            this.remove(this.getId());
        }
    }


    /**
     * 削除処理．
     */
    remove() {
        let view = document.getElementById("view");
        if (view != null) {
            const selfNode = document.getElementById(this.getId());
            if (selfNode) {
                view.removeChild(selfNode);
                delete this;
            }
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


module.exports = CollisionEffect;