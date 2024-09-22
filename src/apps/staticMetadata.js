const staticMetadata = (()=> {

    let metadata = {};

    let registerMetadataHint = async (appId, name, iconCanvasOrB64) => {
        throw new Error();
    };

    let getMetadataHint = appId => {
        throw new Error();
    };

    return Object.freeze({
        registerMetadataHint,
        getMetadataHint,
    });
})();
