function parentDir(dir, depth=1) {
    // split on "\" or "/"
    return dir.split(/\\|\//).slice(0, -depth).join('/');
}

module.exports = {
    parentDir,
}