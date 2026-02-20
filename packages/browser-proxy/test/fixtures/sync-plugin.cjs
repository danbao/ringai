class SyncPlugin {
    click(_applicant, argument) {
        return argument;
    }

    kill() {
        /* empty */
    }
}

module.exports = (_config) => new SyncPlugin();
