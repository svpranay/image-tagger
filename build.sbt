name := "image-tagger"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  javaJdbc,
  javaEbean,
  cache,
  "com.fasterxml.jackson.core" % "jackson-databind" % "2.2.3"
)

play.Project.playJavaSettings
