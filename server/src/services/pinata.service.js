const { Blob, File } = require('node:buffer');

class PinataService {
    isConfigured() {
        return Boolean(
            process.env.PINATA_API_KEY &&
            process.env.PINATA_SECRET_API_KEY &&
            process.env.PINATA_GATEWAY
        );
    }

    gateway() {
        return process.env.PINATA_GATEWAY.replace(/\/+$/, '');
    }

    async uploadFile(fileBuffer, fileName, mimeType) {
        if (!this.isConfigured()) {
            throw new Error('Chưa cấu hình PINATA_API_KEY, PINATA_SECRET_API_KEY hoặc PINATA_GATEWAY.');
        }

        const blob = new Blob([fileBuffer], { type: mimeType });
        const file = new File([blob], fileName, { type: mimeType });
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            body: formData,
            headers: {
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
            }
        });

        if (!response.ok) {
            console.error('Pinata upload error:', response.status);
            throw new Error('Không thể tải ảnh lên Pinata.');
        }

        const data = await response.json();
        if (!data?.IpfsHash) throw new Error('Pinata không trả về CID của ảnh.');
        return this.getPublicUrl(data.IpfsHash);
    }

    async unpinFile(cid) {
        if (!this.isConfigured()) {
            throw new Error('Chưa cấu hình Pinata trên máy chủ.');
        }

        const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
            method: 'DELETE',
            headers: {
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
            }
        });

        if (!response.ok) {
            console.error('Pinata unpin error:', response.status);
            throw new Error('Không thể gỡ file khỏi Pinata.');
        }
    }

    getPublicUrl(cid) {
        return `${this.gateway()}/${cid}`;
    }

    extractCid(url) {
        const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }
}

module.exports = { PinataService };
