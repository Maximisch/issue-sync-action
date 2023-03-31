"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelSyncer = exports.Label = void 0;
class Label {
}
exports.Label = Label;
class LabelSyncer {
    static syncLabels(gitHubSource, gitHubTarget) {
        // Retrieve labels in source repo
        let sourceRepoLabels = [];
        return gitHubSource.getLabels()
            .then((response) => {
            sourceRepoLabels = response.data;
        }).catch((err) => {
            console.error("Failed to retrieve source repo labels", err);
        }).then(() => {
            // Retrieve labels in target repo
            let targetRepoLabels = [];
            gitHubTarget.getLabels()
                .then((response) => {
                targetRepoLabels = response.data;
            }).catch((err) => {
                console.error("Failed to retrieve target repo labels", err);
            }).then(() => {
                // Filter source repo labels: remove all that from list that are already contained in target (= delta)
                sourceRepoLabels = sourceRepoLabels
                    .filter((label) => targetRepoLabels
                    // Match by name and description, as IDs may vary across repos
                    .find(targetEntry => targetEntry.name == label.name && targetEntry.description == label.description)
                    == undefined);
                // Create delta of missing issues in target
                Promise.all(sourceRepoLabels.map(element => {
                    return gitHubTarget.createLabel(element.name, element.description || "", element.color).then(() => "Successfully synced label " + element.name)
                        .catch((err) => "Failed to sync label " + element.name + ": " + err);
                })).then((results) => {
                    results.forEach(element => console.log(element));
                }).then(() => {
                    console.log("Done");
                    return null;
                });
            });
        });
    }
}
exports.LabelSyncer = LabelSyncer;
