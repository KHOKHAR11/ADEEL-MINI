// Command Registration System
const commands = [];

function cmd(info, func) {
    const data = { ...info };
    data.function = func;
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    if (!info.filename) data.filename = "Not Provided";
    commands.push(data);
    return data;
}

// Fast command lookup cache
const commandCache = new Map();

function getCachedCommand(name) {
    if (commandCache.has(name)) {
        return commandCache.get(name);
    }
    const found = commands.find(c => c.name === name || (c.aliases && c.aliases.includes(name)));
    if (found) {
        commandCache.set(name, found);
    }
    return found;
}

function clearCommandCache() {
    commandCache.clear();
}

function registerCommand(info, func) {
    clearCommandCache();
    return cmd(info, func);
}

module.exports = {
    cmd,
    AddCommand: cmd,
    Function: cmd,
    Module: cmd,
    commands,
    getCachedCommand,
    clearCommandCache,
    registerCommand
};
