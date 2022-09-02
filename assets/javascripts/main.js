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

$(async() => {

    document.getElementById('load_file').addEventListener('click', event => {
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

        load(files => {

            function process(data) {
                var zipFile = new JSZip();

                zipFile.loadAsync(data).then(async function(zipFile) {
                    documents = {};

                    document.getElementById('details').innerHTML = "";

                    tree.removeTree();

                    tree = createTree('placeholder', 'white', FRAGMENTS_MENU, CALLBACKS);

                    var files = zipFile.file(/.*/);
                    var structure = {};
                    var node = null;
                    var rootFolder = null;
                    var setData = false;
                    var root = null;

                    zipFile.forEach(async function(relativePath, zipEntry) {

                        if (zipEntry.dir) {

                            if (node == null) {
                                node = tree.createNode(zipEntry.name.replace(/.$/, ''), false, 'assets/images/folder-icon.png', null, null, 'context1');
                                root = node;
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

                                console.log(filename);

                                if (structure[path] == null) {
                                    node = tree.createNode(path, false, 'assets/images/folder-icon.png', null, null, 'context1');
                                    structure[path] = node;
                                }
        
                                documents[structure[path].id] = data;
        
                                tree.selectedNode = structure[path];
        
                                if (`${path}` == `${fileName.replace('$$', '')}/` && !setData) {
                                    document.getElementById('details').innerHTML = data;
                                    setData = true;
                                }
        
                            } else {
                                var fragmentNode = structure[path].createChildNode(fileName, false, "assets/images/document-icon.png", null, "context2");
        
                                documents[fragmentNode.id] = data;
        
                            }
                        }

                    });

                    tree.drawTree();
                    tree.selectNode(root);

                })

            }

            function readFile(file) {

                if ((/zip/i).test(file.type)) {
                    pdfFile = file;

                    var reader = new FileReader();

                    reader.onload = function(e) {
                        pdfFile = file;

                        process(reader.result);

                    };

                    reader.readAsArrayBuffer(file);

                } else {
                    alert(file.type + " - is not supported");
                }

            }

            if (files.length == 1) {
                readFile(files[0])
            }

        });

    });

    document.addEventListener('dragover', event => event.preventDefault());
    document.addEventListener('drop', event => event.preventDefault());

    CALLBACKS = {

        onclick: function(node) {
            if (documents[node.id] == null) {
                document.getElementById('details').innerHTML = "";
            } else {
                document.getElementById('details').innerHTML = documents[node.id];
            }

        },


    };

    tree = createTree('placeholder', 'white', null, CALLBACKS);

    let paneSep = $("#separator")[0];

    paneSep.sdrag(function(el, pageX, startX, fix) {
        let leftPaneWidth = $("#separator").offset().left - 8;
        let rightPaneLeft = $("#separator").offset().left + 9;

        $("#container").width(leftPaneWidth + "px");
        $("#details").css("left", rightPaneLeft + "px");

    });

});