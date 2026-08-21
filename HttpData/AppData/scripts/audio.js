(() => {
    const volumeStorageKey = "tardquest-shell-master-volume";
    const volumeSlider = document.getElementById("audioVolume");
    const volumeValue = document.getElementById("audioVolumeValue");
    const gameFrame = document.getElementById("gameFrame");

    if (!volumeSlider || !volumeValue || !gameFrame) {
        return;
    }

    const clampPercent = value => Math.min(100, Math.max(0, Number(value) || 0));

    const bridgeSource = fetch("scripts/audio-bridge.js")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Audio bridge request failed: ${response.status}`);
            }
            return response.text();
        });

    async function installAudioBridge() {
        try {
            const source = await bridgeSource;
            gameFrame.contentWindow?.eval(source);
            sendVolumeToGame();
        } catch (error) {
            console.error("Unable to install the game audio bridge:", error);
        }
    }

    function sendVolumeToGame() {
        gameFrame.contentWindow?.postMessage(
            {
                type: "tardquest-set-master-volume",
                value: clampPercent(volumeSlider.value) / 100,
            },
            "*"
        );
    }

    function updateVolume(value) {
        const percent = clampPercent(value);
        volumeSlider.value = percent;
        volumeValue.textContent = `${percent}%`;
        localStorage.setItem(volumeStorageKey, String(percent));
        sendVolumeToGame();
    }

    const savedVolume = localStorage.getItem(volumeStorageKey);
    updateVolume(savedVolume === null ? volumeSlider.value : savedVolume);

    volumeSlider.addEventListener("input", event => {
        updateVolume(event.target.value);
    });

    gameFrame.addEventListener("load", sendVolumeToGame);
    gameFrame.addEventListener("load", installAudioBridge);
    installAudioBridge();
})();
