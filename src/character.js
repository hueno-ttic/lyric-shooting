document.write('<img id="miku" name="miku" src="pic/miku.gif"  style="position:absolute;left:0; bottom:0;" width="10%" height="20%" >');

//キャラクターの位置
var y = 0;
var x = 0;

//なにかキーが押されたとき、keydownfuncという関数を呼び出す
addEventListener("keydown", keydownfunc);

//キーが押されたときに呼び出される関数
function keydownfunc(event) {

    //押されたボタンに割り当てられた数値（すうち）を、key_codeに代入
    var key_code = event.keyCode;

    if (key_code === 37) x -= 32; //「左ボタン」が押されたとき、xの値から32を引き算する
    if (key_code === 39) x += 32; //「右ボタン」が押されたとき、xの値に32を足し算する
    miku.style.left = x;

}