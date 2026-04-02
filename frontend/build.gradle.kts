plugins {
    id("com.github.node-gradle.node")
}

node {
    version = "22.14.0"
    download = true
    nodeProjectDir = projectDir
}

val npmBuild by tasks.registering(com.github.gradle.node.npm.task.NpmTask::class) {
    dependsOn(tasks.npmInstall)
    args = listOf("run", "build")
    inputs.dir("src")
    inputs.file("package.json")
    inputs.file("vite.config.ts")
    outputs.dir("dist")
}

val npmTest by tasks.registering(com.github.gradle.node.npm.task.NpmTask::class) {
    dependsOn(tasks.npmInstall)
    args = listOf("run", "test", "--", "--run")
}

val npmTypeCheck by tasks.registering(com.github.gradle.node.npm.task.NpmTask::class) {
    dependsOn(tasks.npmInstall)
    args = listOf("exec", "--", "tsc", "-b", "--noEmit")
    inputs.dir("src")
    inputs.file("tsconfig.json")
    inputs.file("tsconfig.app.json")
    inputs.file("tsconfig.node.json")
}

tasks.register("build") { dependsOn(npmBuild) }
tasks.register("check") { dependsOn(npmTypeCheck, npmTest) }
