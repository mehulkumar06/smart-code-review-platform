function analyzeStructure(files) {

    let documentationScore = 100;
    let structureScore = 100;
    let codeScore = 100;

    let issues = [];
    let strengths = [];

    const fileNames = files.map(f => f.name.toLowerCase());


    // -----------------------
// 📄 File Name Previews
// -----------------------

const pythonPreview =
    files
        .filter(f =>
            f.name.endsWith(".py")
        )
        .slice(0, 3)
        .map(f => f.name);

const notebookPreview =
    files
        .filter(f =>
            f.name.endsWith(".ipynb")
        )
        .slice(0, 3)
        .map(f => f.name);

const csvPreview =
    files
        .filter(f =>
            f.name.endsWith(".csv")
        )
        .slice(0, 3)
        .map(f => f.name);

const jsPreview =
    files
        .filter(f =>
            f.name.endsWith(".js")
        )
        .slice(0, 3)
        .map(f => f.name);


    // -----------------------
// 📊 File Type Detection
// -----------------------

const pythonFiles =
    fileNames.filter(f =>
        f.endsWith(".py")
    ).length;

const notebookFiles =
    fileNames.filter(f =>
        f.endsWith(".ipynb")
    ).length;

const csvFiles =
    fileNames.filter(f =>
        f.endsWith(".csv")
    ).length;

const jsFiles =
    fileNames.filter(f =>
        f.endsWith(".js")
    ).length;

const totalFiles =
    files.length;

    // -----------------------
    // 📄 Documentation Check
    // -----------------------

    const hasReadme =
        fileNames.includes("readme.md");

    if (!hasReadme) {

        documentationScore -= 30;

        issues.push({
    message: "Missing README documentation",
    severity: "high"
});

    } else {

        strengths.push(
            "README documentation available"
        );

    }

    const hasLicense =
        fileNames.includes("license");

    if (hasLicense) {

        strengths.push(
            "License file included"
        );

    }

    // -----------------------
    // 📁 Structure Check
    // -----------------------

    const folders =
        files.filter(f =>
            f.path.includes("/")
        );

    if (folders.length < 3) {

        structureScore -= 20;

        issues.push({
    message: "Project has very few folders",
    severity: "medium"
});

    } else {

        strengths.push(
            "Project organized into folders"
        );

    }

    const rootFiles =
        files.filter(f =>
            !f.path.includes("/")
        ).length;

    if (rootFiles > 10) {

        structureScore -= 15;

        issues.push({
    message: "Too many files in root directory",
    severity: "medium"
});

    }

    // -----------------------
    // 🧠 Project Type Detection
    // -----------------------

    let projectType =
        "General Project";

    const hasPython =
        fileNames.some(f =>
            f.endsWith(".py")
        );

    const hasNotebook =
        fileNames.some(f =>
            f.endsWith(".ipynb")
        );

    const hasCSV =
        fileNames.some(f =>
            f.endsWith(".csv")
        );

    const hasJS =
        fileNames.some(f =>
            f.endsWith(".js")
        );

    if (hasPython) {

        projectType =
            "Python Project";

        strengths.push(
            "Python files detected"
        );

    }

    if (hasNotebook) {

        projectType =
            "Data Analysis Project";

        strengths.push(
            "Jupyter notebooks detected"
        );

    }

    if (hasCSV) {

        strengths.push(
            "Dataset files detected"
        );

    }

    if (hasJS) {

        strengths.push(
            "JavaScript files detected"
        );

    }

    // -----------------------
    // 🧪 Code Quality Check
    // -----------------------

    


    // -----------------------
    // 🎯 Calculate Overall
    // -----------------------

    const overallScore =
        Math.round(
            (
                documentationScore +
                structureScore +
                codeScore
            ) / 3
        );

    let summary =
        overallScore > 80
            ? "Well-structured project"
            : overallScore > 50
            ? "Moderately structured project"
            : "Poorly structured project";

    
    // -----------------------
// 🩺 Repository Health
// -----------------------

let healthStatus = "Needs Improvement";
let healthColor = "yellow";

if (overallScore >= 80) {

    healthStatus = "Healthy Project";
    healthColor = "green";

}
else if (overallScore < 50) {

    healthStatus = "High Risk Project";
    healthColor = "red";

}

    return {

    documentationScore,
    structureScore,
    codeScore,
    overallScore,
    summary,
    issues,
    strengths,
    projectType,

    // 📊 File insights
    pythonFiles,
    notebookFiles,
    csvFiles,
    jsFiles,
    totalFiles,

    // 📄 File previews
pythonPreview,
notebookPreview,
csvPreview,
jsPreview,

healthStatus,
healthColor,

};
}

module.exports = {
    analyzeStructure
};