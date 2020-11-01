document.write('<img id="miku" name="miku" src="pic/miku.gif"  style="position:absolute;left:0; bottom:0;" width="10%" height="20%" >');
//document.write('<img id="negi" name="negi" src="pic/negi.png" width="5%" height="10%" stayle="display:none">');


//キャラクターの位置
var y = 0;
var x = 0;
var negi_count = 0;
let negi = [];

//なにかキーが押されたとき、keydownfuncという関数を呼び出す
addEventListener("keydown", keydownfunc);

setInterval(updateView, 100);

//キーが押されたときに呼び出される関数
function keydownfunc(event) {

    //押されたボタンに割り当てられた数値（すうち）を、key_codeに代入
    var key_code = event.keyCode;

    // ミクを動かす
    moveMiku(key_code);

    // ネギを投げるか
    throwNegi(key_code);

}

function moveMiku(key_code) {
    var miku = document.getElementById("miku");
    // 左ボタン
    if (key_code === 37 && 32 <= parseInt(miku.style.left)) {
        x -= 32;
    }
    // 右ボタン
    if (key_code === 39 && window.innerWidth > parseInt(miku.style.left)) {
        x += 32;
    }
    miku.style.left = x;
}


function throwNegi(key_code) {
    // エンターキーが押されたらネギを投げる
    if (key_code === 13) {

        // 投げるネギの生成
        negi[negi_count] = new Negi(negi_count);
        negi_count++;
    }
}

function updateView() {

    // ネギの挙動更新
    for (i = 0; i < negi_count; i++) {
        // インスタンスが存在するか
        if (typeof negi[i] === 'undefined') {
            continue;
        }
        // インスタンスの更新
        negi[i].update();

        // 画面外に出ていたら削除
        if (negi[i].get_y() > window.innerHeight) {
            delete negi[i];
        }
    }
}

function rand(min, max) {

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Negi {
    x = 0;
    y = 0;
    count = 0;
    constructor(negi_count) {
        this.count = negi_count;
        // ネギオブジェクトの初期設定
        var img = document.createElement('img');
        img.id = 'negi' + negi_count;
        img.src = 'pic/negi.png';

        // イメージの大きさ
        img.width = "25";
        img.height = "50";

        // ネギの初期生成位置
        img.style.position = "absolute";
        var miku = document.getElementById("miku");
        img.style.left = miku.style.left;
        img.style.bottom = miku.style.bottom;

        document.getElementById("view").appendChild(img);
    }

    update() {
        // ゲームループ分のネギの
        var character = document.getElementById('negi' + this.count);
        this.y += 20;
        character.style.bottom = this.y;
        console.log("update " + character.style.bottom);

    }

    get_x() {
        return this.x;
    }
    get_y() {
        return this.y;
    }
}