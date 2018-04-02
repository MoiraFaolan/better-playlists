import React, { Component } from 'react';
import 'reset-css/reset.css';
import './App.css';
import queryString from 'query-string'; 

let defaultStyle = {
  color: '#fff',
  'font-family': 'Segoe UI Light'
};

let counterStyle = {...defaultStyle, 
  width: "40%", 
  display: 'inline-block',
  'margin-bottom': '20px',
  'font-size': '20px',
  'line-height': '30px'
}

class PlaylistCounter extends Component {
  render () {
    let playlistCounterStyle = counterStyle
    return (
      <div style={playlistCounterStyle}>
        <h2>{this.props.playlists.length} playlists</h2>
      </div>
    );
  }
}

class HoursCounter extends Component {
  render () {
    let allSongs = this.props.playlists.reduce((songs, eachPlaylist) => {
      return songs.concat(eachPlaylist.songs)
    }, [])
    let totalDuration = allSongs.reduce((sum, eachSong) => {
      return sum + eachSong.duration
    }, 0)
    let totalDurationHours = Math.round(totalDuration/60/60)
    let isTooLow = totalDurationHours < 1
    let hoursCounterStyle = {...counterStyle, 
      color: isTooLow ? 'red' : 'white',
      'font-weight': isTooLow ? 'bold' : 'normal'

    }    
    return (
      <div style={hoursCounterStyle}>
        <h2>{totalDurationHours} hours</h2>
      </div>
    );
  }
}

class Filter extends Component {
  render () {
    return (
      <div style={defaultStyle}>
        <img/>
        <input type="text" placeholder="Filter playlists..." onKeyUp={event => 
          this.props.onTextChange(event.target.value)}
          style={{...defaultStyle,
            color: 'black',
            padding: '10px', 
            'margin-bottom': '20px',
            'border-radius': '25px', 
            'border': 'none'}}/>
      </div>
    );
  }
}

class Playlist extends Component {
  render () {
    let playlist = this.props.playlist
    return (
        <div style={{...defaultStyle, 
          display: 'inline-block',
          width: '25%',
          padding: '10px',
          'background-color': this.props.index % 2 
            ? '#808080' 
            : '#1db954'
          }}>
          <img src={playlist.imageUrl} style={{width: '100px'}}/>
          <h3 style={{'font-weight': 'bold'}}>{playlist.name}</h3>
          <ul style={{'margin-top': '10px'}}>
            {playlist.songs.map(song =>
              <li style={{'padding-top': '2px'}}>{song.name}</li>
            )}
          </ul>
        </div>

    );
  }
}

class App extends Component {
  constructor () {
    super ();
    this.state = {
      serverData: {},
      filterString: ''
    }
  }
  componentDidMount () {
    let parsed = queryString.parse(window.location.search);
    let accessToken = parsed.access_token;
    if (!accessToken)
      return;
    fetch('https://api.spotify.com/v1/me', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then(response => response.json())
    .then(data => this.setState({
      user: {
        name: data.display_name
      }
    }))
    
    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then(response => response.json())
    .then(playlistData => {
      let playlists = playlistData.items
      let trackDataPromises = playlists.map(playlist => {
        let responsePromise = fetch(playlist.tracks.href, {
          headers: {'Authorization': 'Bearer ' + accessToken}
        })
        let trackDataPromise = responsePromise
          .then(response => response.json())
        return trackDataPromise
      })
      let allTracksDataPromises = 
        Promise.all(trackDataPromises)
      let playlistsPromise = allTracksDataPromises.then(trackDatas => {
        trackDatas.forEach((trackData, i) => {
          playlists[i].trackDatas = trackData.items
            .map(item => item.track)
            .map(trackData => ({
              name: trackData.name,
              duration: trackData.duration_ms / 1000
            }))
        })
        return playlists
      })
    return playlistsPromise
    })
    .then(playlists => this.setState({
      playlists: playlists.map(item => {
        return {
          name: item.name,
          imageUrl: item.images[0].url, 
          songs: item.trackDatas.slice(0,3)
        }
      })
    }))

  }
  render() {
    let playlistsToRender = 
      this.state.user && 
      this.state.playlists 
        ? this.state.playlists.filter(playlist => {
          let matchesPlaylist = playlist.name.toLowerCase().includes(
            this.state.filterString.toLowerCase())
          let matchesSong = playlist.songs.find(song => song.name.toLowerCase().includes(
            this.state.filterString.toLowerCase()
          ))
          return matchesPlaylist || matchesSong
        })
        : []
    return (
      <div className="App">
        {this.state.user ? 
        <div>
          <h1 style={{...defaultStyle, 
            'font-size': '54px',
            'margin-top': '5px',
            'margin-bottom': '20px'
            }}>
            {this.state.user.name}'s Playlists
          </h1>
          <PlaylistCounter playlists={playlistsToRender}/>
          <HoursCounter playlists={playlistsToRender}/>
          <Filter onTextChange={text => {
            this.setState({filterString: text})
            }}/>
          {playlistsToRender.map((playlist, i)  => 
            <Playlist playlist={playlist} index={i}/>
          )}
        </div> : 
        <div style={{'display': 'grid', 'align-self': 'center', 'justify-self': 'center', 'height': '50px'}}>
          <button onClick={() => {
            window.location = window.location.href.includes('localhost') 
              ? 'http://localhost:8888/login'
              : 'https://better-playlists-backend-mf.herokuapp.com/login'}
          }
          style={{...defaultStyle,
            padding: '10px', 
            'font-size': '20px',
            'font-weight': 'bold', 
            'margin-top': '40px',
            'border-radius': '25px',
            'background-color': '#1db954',
            'border': 'none',
            'text-align': 'center'
          }}>Sign in with Spotify</button>
        </div>
        } 
      </div>
    );
  }
}

export default App;
