function toqishEffekti(text, delay = 50) {
    let index = 0;
    const interval = setInterval(() => {
        process.stdout.write(text[index]);
        index++;
        if (index >= text.length) {
            clearInterval(interval);
            console.log();
        }
    }, delay);
}

toqishEffekti("🧶 8-A Bot konsolga muvaffaqiyatli to'qib joylashtirildi!", 40);
