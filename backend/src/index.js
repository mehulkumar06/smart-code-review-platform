const mode = process.env.SERVICE_MODE || "server";

if (mode === "worker") {
    console.log("Starting in WORKER mode...");
    require("./worker");
} else {
    console.log("Starting in SERVER mode...");
    require("./server");
}