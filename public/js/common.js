Object.values = (obj) => Object.keys(obj).map(key => obj[key]);

$("#message_content").keyup(function(event) {
    if (event.keyCode === 13) {
        var content = this.value;
        var caret = getCaret(this);
        if(event.shiftKey){
            this.value = content.substring(0, caret - 1) + "\n" + content.substring(caret, content.length);
            event.stopPropagation();
        } else {
            $("#message_send").click();
        }}
});

function getCaret(el) {
    if (el.selectionStart) {
        return el.selectionStart;
    } else if (document.selection) {
        el.focus();
        var r = document.selection.createRange();
        if (r == null) {
            return 0;
        }
        var re = el.createTextRange(), rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
        return rc.text.length;
    }
    return 0;
}