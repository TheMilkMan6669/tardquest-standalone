(() => {
    const gamePath = window.location.pathname;
    const isGameDocument =
        /\/GameData\/game\.html$/.test(gamePath)

    if (!isGameDocument || window.__tardquestAudioBridgeInstalled) {
        return;
    }

    window.__tardquestAudioBridgeInstalled = true;

    let masterVolume = 1;
    const clampVolume = value => Math.min(1, Math.max(0, Number(value) || 0));

    const mediaVolume = Object.getOwnPropertyDescriptor(
        HTMLMediaElement.prototype,
        "volume"
    );
    const mediaPlay = HTMLMediaElement.prototype.play;
    const mediaBaseVolumes = new WeakMap();
    const trackedMedia = new Set();

    const applyMediaVolume = audio => {
        const baseVolume = mediaBaseVolumes.get(audio) ?? mediaVolume.get.call(audio);
        mediaVolume.set.call(audio, clampVolume(baseVolume) * masterVolume);
    };

    const rememberMediaVolume = audio => {
        if (!mediaBaseVolumes.has(audio)) {
            mediaBaseVolumes.set(audio, clampVolume(mediaVolume.get.call(audio)));
        }
        trackedMedia.add(audio);
    };

    const registerMedia = audio => {
        if (!(audio instanceof HTMLMediaElement)) {
            return;
        }

        rememberMediaVolume(audio);
        applyMediaVolume(audio);
    };

    const registerCollection = collection => {
        if (!collection || typeof collection !== "object") {
            return;
        }

        Object.values(collection).forEach(entry => {
            registerMedia(entry?.audio ?? entry);
        });
    };

    if (mediaVolume?.get && mediaVolume?.set && typeof mediaPlay === "function") {
        Object.defineProperty(HTMLMediaElement.prototype, "volume", {
            configurable: mediaVolume.configurable,
            enumerable: mediaVolume.enumerable,
            get: mediaVolume.get,
            set(value) {
                mediaBaseVolumes.set(this, clampVolume(value));
                trackedMedia.add(this);
                mediaVolume.set.call(this, clampVolume(value) * masterVolume);
            },
        });

        HTMLMediaElement.prototype.play = function(...args) {
            rememberMediaVolume(this);
            applyMediaVolume(this);
            return mediaPlay.apply(this, args);
        };

        const nativeCreateElement = document.createElement.bind(document);
        document.createElement = function(localName, ...args) {
            const element = nativeCreateElement(localName, ...args);
            if (String(localName).toLowerCase() === "audio" ||
                String(localName).toLowerCase() === "video") {
                registerMedia(element);
            }
            return element;
        };

        document.querySelectorAll("audio, video").forEach(registerMedia);
        if (typeof TARDQUEST_MUSIC_TRACKS !== "undefined") {
            registerCollection(TARDQUEST_MUSIC_TRACKS);
        }
        if (typeof sfx !== "undefined") {
            registerCollection(sfx);
        }
        if (typeof sfxAmb !== "undefined") {
            registerCollection(sfxAmb);
        }
    }

    const nativeConnect = window.AudioNode?.prototype?.connect;
    const masterGainRecords = new Set();

    if (typeof nativeConnect === "function") {
        const getMasterGain = context => {
            const existingRecord = [...masterGainRecords]
                .find(record => record.context === context);
            if (existingRecord) {
                return existingRecord.gain;
            }

            const gain = context.createGain();
            gain.gain.value = masterVolume;
            nativeConnect.call(gain, context.destination);

            const record = { context, gain };
            masterGainRecords.add(record);
            return gain;
        };

        window.AudioNode.prototype.connect = function(destination, ...args) {
            const context = this.context;
            if (context && destination === context.destination) {
                const masterGain = getMasterGain(context);
                if (this !== masterGain) {
                    return nativeConnect.call(this, masterGain, ...args);
                }
            }

            return nativeConnect.call(this, destination, ...args);
        };
    }

    const setMasterVolume = value => {
        masterVolume = clampVolume(value);

        trackedMedia.forEach(applyMediaVolume);
        masterGainRecords.forEach(record => {
            record.gain.gain.value = masterVolume;
        });
    };

    window.addEventListener("message", event => {
        if (
            event.source !== window.parent ||
            event.data?.type !== "tardquest-set-master-volume"
        ) {
            return;
        }

        setMasterVolume(event.data.value);
    });
})();
