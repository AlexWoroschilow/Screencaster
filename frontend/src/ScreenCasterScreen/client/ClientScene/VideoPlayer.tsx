import React, {Component, createRef} from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// @ts-ignore
import Player = videojs.Player;

interface VideoPlayerProps {
    // @ts-ignore
    options: videojs.PlayerOptions;
    stream?: MediaStream;
}

export class VideoPlayer extends Component<VideoPlayerProps> {
    private videoRef = createRef<HTMLDivElement>();
    private player: Player | null = null;

    componentDidMount() {
        if (!this.videoRef.current) return;

        const videoElement = document.createElement('video-js');
        videoElement.classList.add('vjs-big-play-centered');
        this.videoRef.current.appendChild(videoElement);

        this.player = videojs(videoElement, this.props.options, () => {
            (this?.props?.stream != undefined) &&
            this.setMediaStream(this.props.stream);
        });
    }

    private setMediaStream(stream: MediaStream): void {
        if (this?.player == undefined) {
            return;
        }

        const tech = this.player.tech(true) as any;
        if (tech && typeof tech.el === 'function') {
            const videoTag = tech.el() as HTMLVideoElement;
            (videoTag != undefined) &&
            (videoTag.srcObject = stream);
        }

    }

    componentDidUpdate(prevProps: VideoPlayerProps) {
        if (this?.props?.stream && prevProps?.stream !== this?.props?.stream) {
            this.setMediaStream(this.props.stream);
        }
    }

    componentWillUnmount() {
        (this?.player?.dispose) &&
        this.player.dispose();
    }

    render() {
        return (
            <div data-vjs-player>
                <div ref={this.videoRef}/>
            </div>
        );
    }
}