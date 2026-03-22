import OncoprintJS from './oncoprint';

if (typeof window !== 'undefined') {
    window.Oncoprint = OncoprintJS;
}

module.exports = OncoprintJS;
