function FileUtil(document) {

    this._document = document;

};

FileUtil.prototype.saveAs = async function(data, fileName, mimetype) {
    var saveLink = this._document.createElementNS("http://www.w3.org/1999/xhtml", "a");
    var canUseSaveLink = "download" in saveLink;
    var getURL = function() {
        return view.URL || view.webkitURL || view;
    }

    function waitOnFocus() {

        return new Promise(resolve => {

            function checkFocus() {

                if (document.hasFocus()) {

                    resolve(saveLink.download);
                } else {
                    window.setTimeout(checkFocus, 1000);
                }
            }

            window.setTimeout(checkFocus, 1000);

        });
    }


    var click = function(node) {
        var event = new MouseEvent("click");
        node.dispatchEvent(event);
    }
    var file = new Blob([data], { type: mimetype });

    var fileURL = URL.createObjectURL(file);

    saveLink.href = fileURL;
    saveLink.download = fileName;

    click(saveLink);

    var filename = await waitOnFocus();
    return saveLink.download;

};

FileUtil.prototype.load = function(filter, callback) {
    var loadButton = this._document.createElementNS("http://www.w3.org/1999/xhtml", "input");

    loadButton.setAttribute("type", "file");
    loadButton.accept = filter;

    loadButton.addEventListener('change', function(event) {
        callback(event.target.files);

        return false;

    }, false);

    loadButton.click();

};