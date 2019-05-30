import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";

import { RNCamera } from "react-native-camera";
import Video from "react-native-video";

import { RNS3 } from "react-native-aws3";

const PendingView = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: "lightgreen",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <Text>Waiting</Text>
  </View>
);

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      videojob: ""
    };
    this.startRecording = this.startRecording.bind(this);
    this.prepareRatio = this.prepareRatio.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
  }

  startRecording = async () => {
    this.setState({ recording: true });
    const { uri, codec = "mp4" } = await this.camera.recordAsync();
    this.setState({ recording: false, processing: true });
    const mime = codec === "mp4" ? codec : "quicktime";
    const ext = codec === "mp4" ? codec : "mov";
    const type = `video/${mime}`;

    const video = {
      uri,
      name: `videojob-${new Date().getTime()}.${ext}`,
      type
    };

    const options = {
      keyPrefix: "unp*************/",
      bucket: "test*************",
      region: "us-east-1",
      accessKey: "AKI*************",
      secretKey: "hw*************",
      successActionStatus: 201
    };

    const file = await RNS3.put(video, options);

    this.setState({ videojob: file.body.postResponse.location });

    this.setState({ processing: false });
  };

  stopRecording = () => {
    this.camera.stopRecording();
  };

  prepareRatio = async () => {
    if (Platform.OS === "android" && this.cam) {
      const ratios = await this.cam.getSupportedRatiosAsync();
      const ratio =
        ratios.find(ratio => ratio === "16:9") || ratios[ratios.length - 1];
      this.setState({ ratio });
    }
  };

  render() {
    const { recording, processing } = this.state;

    if (this.state.videojob !== "") {
      return (
        <Video
          source={{ uri: this.state.videojob }}
          onEnd={() => this.setState({ videojob: "" })}
          style={styles.backgroundVideo}
        />
      );
    }

    let button = (
      <TouchableOpacity
        onPress={this.startRecording.bind(this)}
        style={styles.capture}
      >
        <Text style={{ fontSize: 14 }}> RECORD </Text>
      </TouchableOpacity>
    );

    if (recording) {
      button = (
        <TouchableOpacity
          onPress={this.stopRecording.bind(this)}
          style={styles.capture}
        >
          <Text style={{ fontSize: 14 }}> STOP </Text>
        </TouchableOpacity>
      );
    }

    if (processing) {
      button = (
        <View style={styles.capture}>
          <ActivityIndicator animating size={1} />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.front}
          flashMode={RNCamera.Constants.FlashMode.auto}
          permissionDialogTitle={"Permission to use camera"}
          permissionDialogMessage={
            "We need your permission to use your camera phone"
          }
          onCameraReady={this.prepareRatio}
          ratio={this.state.ratio}
        >
          {({ camera, status }) => {
            if (status !== "READY") return <PendingView />;
            return (
              <View
                style={{
                  flex: 0,
                  flexDirection: "row",
                  justifyContent: "center"
                }}
              >
                {button}
              </View>
            );
          }}
        </RNCamera>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "black"
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  capture: {
    flex: 0,
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: "center",
    margin: 20
  },
  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  }
});
