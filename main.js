'use strict';

const config = require('./config.json');

const electron = require('electron');

const { app } = electron;
const { protocol } = electron;
const { ipcMain } = electron;
const { dialog } = electron;
const { shell } = electron;
const { webContents } = electron;
const { contextBridge } = electron;

const BrowserWindow = electron.BrowserWindow;

const mime = require('mime');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');

var mainWindow = null;

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1470,
        height: 800,
        resizable: true,
        frame: true,
        autoHideMenuBar: true,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            nativeWindowOpen: true
        }

    });

    if (config.mode == "debug") {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.setMenu(null);
    mainWindow.setTitle("Knowledge Viewer");
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }))

    mainWindow.on('closed', () => {
        mainWindow = null
    })

}

app.on('ready', () => {

    createWindow();

});