const { sortedIndex } = require("textalive-app-api");

class Negi {
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

        // ネギの初期生成位置
        img.style.position = "absolute";
        var miku = document.getElementById("miku");
        img.style.left = this.x = parseInt(miku.style.left) + 60;
        img.style.bottom = this.y = parseInt(miku.style.bottom) + 100;

        if (document.getElementById("view")) {
            document.getElementById("view").appendChild(img);
        }
    }

    remove_document() {
        // ネギオブジェクトの削除
        var view = document.getElementById("view");
        if (view != null) {
            console.log("delete:" + this.getId());
            var selfNode = document.getElementById(this.getId())
            view.removeChild(selfNode);
        }
    }
    is_removed() {
        var view = document.getElementById("view");
        if (view != null) {
            var selfNode = document.getElementById(this.getId())
            return selfNode == null;
        }
        return false;
    }

    // @param delta:前回呼び出し時からのposiiton差分
    update(delta) {
        var character = document.getElementById(this.getId());
        if (character == null) {
            return;
        }
        this.y += 50 * delta;
        character.style.bottom = this.y;
    }

    getId() {
        return "negi" + this.count;
    }
    get_x() {
        return this.x;
    }
    get_left() {
        var character = document.getElementById(this.getId());
        return parseInt(character.style.left);
    }
    get_y() {
        return this.y;
    }
    get_bottom() {
        var character = document.getElementById(this.getId());
        console.log("bottom:" + this.count);
        return parseInt(character.style.bottom);
    }

    get_count() {
        return this.count;
    }
}

module.exports = Negi;