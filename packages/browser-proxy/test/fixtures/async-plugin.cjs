class AsyncPlugin {
    async click(_applicant, argument) {
        return argument;
    }

    async kill() {
        /* empty */
    }
}

module.exports = (_config) => new AsyncPlugin();
