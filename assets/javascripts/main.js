let documents = {};

let tree = null;

let filename = null;

let FRAGMENTS_MENU = null;
let CALLBACKS = null;

let editors = [];

const extractFilename = (path) => {
    const pathArray = path.split("/");
    const lastIndex = pathArray.length - 1;
    return pathArray[lastIndex];
};

$.fn.Load = (filepath) => {

    window.api.fs().readFile(filepath, function(err, data) {
        var zipFile = new JSZip();

        zipFile.loadAsync(data).then(async function(zipFile) {
            documents = {};
            editors[0].setHTML("");

            tree.removeTree();

            tree = createTree('placeholder', 'white', FRAGMENTS_MENU, CALLBACKS);

            var files = zipFile.file(/.*/);
            var structure = {};
            var node = null;
            var rootFolder = null;
            var setData = false;

            zipFile.forEach(async function(relativePath, zipEntry) {

                if (zipEntry.dir) {

                    if (node == null) {
                        node = tree.createNode(zipEntry.name.replace(/.$/, ''), false, 'assets/images/folder-icon.png', null, null, 'context1');
                    } else {
                        var paths = relativePath.replace(/.$/, '').split("/");
                        var folder = ""

                        for (var iPath = 0; iPath < paths.length - 1; iPath++) {
                            folder += paths[iPath] + "/";
                        }

                        node = structure[folder].createChildNode(paths[paths.length - 1], false, "assets/images/folder-icon.png", null, "context2");

                    }

                    structure[relativePath] = node;

                } else {

                    function getBlob(file) {

                        return new Promise(resolve => {
                            file.async("blob").then(function(blob) {
                                resolve(blob);
                            });

                        });

                    }

                    function readBlob(url) {

                        return new Promise(resolve => {
                            var reader = new FileReader();

                            reader.onload = function() {
                                resolve(reader.result);
                            }

                            reader.readAsText(url);

                        });

                    }

                    let fileUrl = await getBlob(zipEntry);
                    let data = await readBlob(fileUrl);
                    let fileName = extractFilename(zipEntry.name);
                    let path = relativePath.replace(fileName, '');

                    fileName = fileName.split(".html").join("");

                    if (fileName.startsWith('$$')) {

                        if (structure[path] == null) {
                            node = tree.createNode(path, false, 'assets/images/folder-icon.png', null, null, 'context1');
                            structure[path] = node;
                        }

                        documents[structure[path].id] = data;

                        tree.selectedNode = structure[path];

                        if (`${path}` == `${fileName.replace('$$', '')}/` && !setData) {
                            editors[0].setHTML(data);
                            setData = true;
                        }

                    } else {
                        var fragmentNode = structure[path].createChildNode(fileName, false, "assets/images/document-icon.png", null, "context2");

                        documents[fragmentNode.id] = data;

                    }

                }

            });

            tree.drawTree();

        })

    })

}

$.fn.Join = (childNodes, html, level) => {

    for (let childNode in childNodes) {
        html.push(documents[childNodes[childNode].id] == null ? '' : documents[childNodes[childNode].id]);

        if (level < 2 && documents[childNodes[childNode].id] != null &&
            documents[childNodes[childNode].id].trim().length > 0) {
            html.push(`<div class="break"></div>`);
        }

        if (childNodes[childNode].childNodes.length > 0) {
            $(this).Join(childNodes[childNode].childNodes, html, level + 1);
        }

    }

}

$(async() => {
    function load(callback) {
        var loadButton = document.createElementNS("http://www.w3.org/1999/xhtml", "input");

        loadButton.setAttribute("type", "file");

        loadButton.addEventListener('change', function(e) {
            var files = e.target.files

            callback(files);

            return false;

        }, false);

        loadButton.click();

    }

    document.addEventListener('dragover', event => event.preventDefault());
    document.addEventListener('drop', event => event.preventDefault());

    $(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();

        if (event.target.id.includes('editor')) {
            window.api.openUrl(this.href);
        }

    });

    document.querySelectorAll('[data-tiny-editor]').forEach(editor => {
        transformToEditor(editor);

        editors.push(editor);

        editor.onChange = (html) => {

            if (tree != null & tree.selectedNode != null) {

                documents[tree.selectedNode.id] = html;
            }

        }

    });

    $("#window-minimize").on('click', async(e) => {

        window.api.minimize();

    });

    $("#window-maximize").on('click', async(e) => {
        var isMaximized = window.api.isMaximized();

        if (!isMaximized) {
            $("#window-maximize").addClass("fa-window-restore");
            $("#window-maximize").removeClass("fa-square");
            window.api.maximize();
        } else {
            $("#window-maximize").removeClass("fa-window-restore");
            $("#window-maximize").addClass("fa-square");
            window.api.unmaximize();
        }

    });

    $('#open').on('click', (e) => {

        let result = window.api.showOpenDialog();

        if (!result.canceled) {
            let filepath = result.filePaths[0];

            $(this).Load(filepath);
            filename = filepath;
            $('#filename').text(`${filepath}`);

        }

    });

    CALLBACKS = {

        onclick: function(node) {
            if (documents[node.id] == null) {
                editors[0].setHTML("");
            } else {
                editors[0].setHTML(documents[node.id]);
            }

        },


    };

    console.log("Start");

    tree = createTree('placeholder', 'white', null, CALLBACKS);

    let paneSep = $("#separator")[0];

    paneSep.sdrag(function(el, pageX, startX, fix) {
        let leftPaneWidth = $("#separator").offset().left - 8;
        let rightPaneLeft = $("#separator").offset().left + 9;

        $("#container").width(leftPaneWidth + "px");
        $("#details").css("left", rightPaneLeft + "px");

    });

});