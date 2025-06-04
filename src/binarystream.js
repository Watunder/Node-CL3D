/**
 * Represents a binary stream for reading and writing data.
 * {@link https://github.com/pocketnode/binarystream}
 */
export class BinaryStream {
    constructor(buffer, offset = 0) {
        this.offset = 0;
        /** @inheritDoc BinaryStream.readBool */
        this.readBoolean = this.readBool;
        /** @inheritDoc BinaryStream.writeBool */
        this.writeBoolean = this.writeBool;
        /**
         * Reads an unsigned/signed byte.
         * @param offset The optional offset to read from.
         * @returns The read byte.
         */
        this.readByte = this.readUInt8;
        /**
         * Writes an unsigned/signed byte.
         * @param v The byte to write.
         * @param offset The optional offset to write at.
         * @returns The updated BinaryStream instance.
         */
        this.writeByte = this.writeUInt8;
        /** @inheritDoc BinaryStream.readUInt16BE */
        this.readUInt16 = this.readUInt16BE;
        /** @inheritDoc BinaryStream.readUInt16BE */
        this.readUShortBE = this.readUInt16BE;
        /** @inheritDoc BinaryStream.readUInt16BE */
        this.readUShort = this.readUInt16BE;
        /** @inheritDoc BinaryStream.writeUInt16BE */
        this.writeUInt16 = this.writeUInt16BE;
        /** @inheritDoc BinaryStream.writeUInt16BE */
        this.writeUShortBE = this.writeUInt16BE;
        /** @inheritDoc BinaryStream.writeUInt16BE */
        this.writeUShort = this.writeUInt16BE;
        /** @inheritDoc BinaryStream.readInt16BE */
        this.readInt16 = this.readInt16BE;
        /** @inheritDoc BinaryStream.readInt16BE */
        this.readShortBE = this.readInt16BE;
        /** @inheritDoc BinaryStream.readInt16BE */
        this.readShort = this.readInt16BE;
        /** @inheritDoc BinaryStream.writeInt16BE */
        this.writeInt16 = this.writeInt16BE;
        /** @inheritDoc BinaryStream.writeInt16BE */
        this.writeShortBE = this.writeInt16BE;
        /** @inheritDoc BinaryStream.writeInt16BE */
        this.writeShort = this.writeInt16BE;
        /** @inheritDoc BinaryStream.readUInt16LE */
        this.readUShortLE = this.readUInt16LE;
        /** @inheritDoc BinaryStream.writeUInt16LE */
        this.writeUShortLE = this.writeUInt16LE;
        /** @inheritDoc BinaryStream.readInt16LE */
        this.readShortLE = this.readInt16LE;
        /** @inheritDoc BinaryStream.readUInt32BE */
        this.readUInt32 = this.readUInt32BE;
        /** @inheritDoc BinaryStream.readUInt32BE */
        this.readUIntBE = this.readUInt32BE;
        /** @inheritDoc BinaryStream.readUInt32BE */
        this.readUInt = this.readUInt32BE;
        /** @inheritDoc BinaryStream.writeUInt32BE */
        this.writeUInt32 = this.writeUInt32BE;
        /** @inheritDoc BinaryStream.writeUInt32BE */
        this.writeUIntBE = this.writeUInt32BE;
        /** @inheritDoc BinaryStream.writeUInt32BE */
        this.writeUInt = this.writeUInt32BE;
        /** @inheritDoc BinaryStream.readInt32BE */
        this.readInt32 = this.readInt32BE;
        /** @inheritDoc BinaryStream.readInt32BE */
        this.readIntBE = this.readInt32BE;
        /** @inheritDoc BinaryStream.readInt32BE */
        this.readInt = this.readInt32BE;
        /** @inheritDoc BinaryStream.writeInt32BE */
        this.writeInt32 = this.writeInt32BE;
        /** @inheritDoc BinaryStream.writeInt32BE */
        this.writeIntBE = this.writeInt32BE;
        /** @inheritDoc BinaryStream.writeInt32BE */
        this.writeInt = this.writeInt32BE;
        /** @inheritDoc BinaryStream.readInt32LE */
        this.readIntLE = this.readInt32LE;
        /** @inheritDoc BinaryStream.writeInt32LE */
        this.writeIntLE = this.writeInt32LE;
        /** @inheritDoc BinaryStream.readUInt32LE */
        this.readUIntLE = this.readUInt32LE;
        /** @inheritDoc BinaryStream.writeUInt32LE */
        this.writeUIntLE = this.writeUInt32LE;
        /** @inheritDoc BinaryStream.writeInt16LE */
        this.writeShortLE = this.writeInt16LE;
        /** @inheritDoc BinaryStream.readTriadBE */
        this.readTriad = this.readTriadBE;
        /** @inheritDoc BinaryStream.writeTriadBE */
        this.writeTriad = this.writeTriadBE;
        /** @inheritDoc BinaryStream.readFloat32BE */
        this.readFloat32 = this.readFloat32BE;
        /** @inheritDoc BinaryStream.readFloat32BE */
        this.readFloatBE = this.readFloat32BE;
        /** @inheritDoc BinaryStream.readFloat32BE */
        this.readFloat = this.readFloat32BE;
        /** @inheritDoc BinaryStream.writeFloat32BE */
        this.writeFloat32 = this.writeFloat32BE;
        /** @inheritDoc BinaryStream.writeFloat32BE */
        this.writeFloatBE = this.writeFloat32BE;
        /** @inheritDoc BinaryStream.writeFloat32BE */
        this.writeFloat = this.writeFloat32BE;
        /** @inheritDoc BinaryStream.readFloat32LE */
        this.readFloatLE = this.readFloat32LE;
        /** @inheritDoc BinaryStream.writeFloat32LE */
        this.writeFloatLE = this.writeFloat32LE;
        /** @inheritDoc BinaryStream.readFloat64BE */
        this.readFloat64 = this.readFloat64BE;
        /** @inheritDoc BinaryStream.readFloat64BE */
        this.readDoubleBE = this.readFloat64BE;
        /** @inheritDoc BinaryStream.readFloat64BE */
        this.readDouble = this.readFloat64BE;
        /** @inheritDoc BinaryStream.writeFloat64BE */
        this.writeFloat64 = this.writeFloat64BE;
        /** @inheritDoc BinaryStream.writeFloat64BE */
        this.writeDoubleBE = this.writeFloat64BE;
        /** @inheritDoc BinaryStream.writeFloat64BE */
        this.writeDouble = this.writeFloat64BE;
        /** @inheritDoc BinaryStream.readFloat64LE */
        this.readDoubleLE = this.readFloat64LE;
        /** @inheritDoc BinaryStream.writeFloat64LE */
        this.writeDoubleLE = this.writeFloat64LE;
        /** @inheritDoc BinaryStream.readBigUInt64BE */
        this.readBigUInt64 = this.readBigUInt64BE;
        /** @inheritDoc BinaryStream.readBigUInt64BE */
        this.readLongBE = this.readBigUInt64BE;
        /** @inheritDoc BinaryStream.readBigUInt64BE */
        this.readLong = this.readBigUInt64BE;
        /** @inheritDoc BinaryStream.writeBigUInt64BE */
        this.writeBigUInt64 = this.writeBigUInt64BE;
        /** @inheritDoc BinaryStream.writeBigUInt64BE */
        this.writeLongBE = this.writeBigUInt64BE;
        /** @inheritDoc BinaryStream.writeBigUInt64BE */
        this.writeLong = this.writeBigUInt64BE;
        /** @inheritDoc BinaryStream.readBigUInt64LE */
        this.readLongLE = this.readBigUInt64LE;
        /** @inheritDoc BinaryStream.writeBigUInt64LE */
        this.writeLongLE = this.writeBigUInt64LE;
        if (typeof buffer === "number") {
            buffer = new ArrayBuffer(buffer);
        }
        else {
            buffer = buffer ?? new ArrayBuffer(0);
        }
        if (buffer instanceof ArrayBuffer) {
            this.view = new DataView(buffer);
        }
        else if (buffer instanceof Uint8Array) {
            this.view = new DataView(buffer.buffer);
        }
        else {
            this.view = new DataView(new Uint8Array(buffer).buffer);
        }
        this.offset = offset;
    }
    transfer(buf, size) {
        const buffer = new ArrayBuffer(size);
        const view = new Uint8Array(buffer);
        view.set(new Uint8Array(buf));
        return buffer;
    }
    /**
     * Gets the underlying DataView of the stream.
     * @returns The DataView object.
     */
    getDataView() {
        return this.view;
    }
    /**
     * Resizes the buffer of the stream.
     * @param size The new size of the buffer.
     * @param canShrink Whether the buffer can be shrunk.
     * @returns The updated BinaryStream instance.
     */
    resize(size, canShrink = true) {
        if (canShrink || (!canShrink && size > this.view.buffer.byteLength)) {
            this.view = new DataView(this.transfer(this.view.buffer, size));
        }
        return this;
    }
    /**
     * Checks if the current stream is equal to another stream or Uint8Array.
     * @param stream The stream or Uint8Array to compare.
     * @returns True if the streams are equal, false otherwise.
     */
    equals(stream) {
        if (this.length !== stream.length)
            return false;
        let self = this.buffer;
        let other = stream instanceof BinaryStream ? stream.buffer : stream;
        for (let i = 0; i < self.byteLength; i++) {
            if (self[i] !== other[i])
                return false;
        }
        return true;
    }
    /**
     * Increases the offset of the stream and returns the start and end offsets.
     * @param length The length to increase the offset by.
     * @param offset The optional offset to set.
     * @returns An object containing the start and end offsets.
     */
    increaseOffset(length, offset) {
        if (offset !== undefined) {
            this.offset = offset;
        }
        return {
            start: this.offset,
            end: this.offset += length
        };
    }
    /**
     * Reads a set of bytes from the buffer.
     * @param length The number of bytes to read.
     * @param offset The optional offset to read from.
     * @returns A Uint8Array containing the read bytes.
     * @throws RangeError if the read operation exceeds the buffer length.
     */
    read(length, offset) {
        const { start, end } = this.increaseOffset(length, offset);
        if (start > this.length) {
            throw new RangeError(`Buffer overrun, cannot read past the end of the buffer. Start: ${start}, End: ${end}, Length: ${this.length}`);
        }
        return new Uint8Array(this.view.buffer.slice(start, end));
    }
    write(buffer, offset) {
        if (buffer instanceof ArrayBuffer) {
            buffer = new Uint8Array(buffer);
        }
        else if (buffer instanceof BinaryStream) {
            buffer = buffer.buffer;
        }
        const { start, end } = this.increaseOffset(buffer.length, offset);
        if (end > this.length) {
            this.resize(end, false);
        }
        for (let i = 0; i < buffer.length; i++) {
            this.view
                .setUint8(start + i, buffer[i]);
        }
        return this;
    }
    /**
     * Resets the stream's buffer.
     * @returns The updated BinaryStream instance.
     */
    reset() {
        return this.resize(0).flip();
    }
    /**
     * Sets the buffer and/or offset of the stream.
     * @param buffer The buffer to set.
     * @param offset The optional offset to set.
     * @returns The updated BinaryStream instance.
     */
    setBuffer(buffer, offset = 0) {
        this.reset().write(buffer);
        this.offset = offset;
        return this;
    }
    /**
     * Gets a copy of the underlying ArrayBuffer as a Uint8Array.
     * @returns A copy of the ArrayBuffer.
     */
    get buffer() {
        return new Uint8Array(this.view.buffer);
    }
    /**
     * Gets the size of the buffer.
     * @returns The size of the buffer.
     */
    get length() {
        return this.view.buffer.byteLength;
    }
    get arrayBuffer() {
        return this.view.buffer;
    }
    /**
     * Creates a Blob from the buffer.
     * @param type The MIME type of the Blob.
     * @returns The created Blob object.
     */
    blob(type = "application/octet-stream") {
        return new Blob([this.view.buffer], { type });
    }
    /**
     * Gets the amount of remaining bytes that can be read.
     * @returns The number of remaining bytes.
     */
    getRemainingBytes() {
        return this.length - this.offset;
    }
    /**
     * Reads the remaining amount of bytes.
     * @returns A Uint8Array containing the remaining bytes.
     */
    readRemainingBytes() {
        return this.read(this.getRemainingBytes());
    }
    /**
     * Reads a boolean value.
     * @param offset The optional offset to read from.
     * @returns boolean value.
     */
    readBool(offset) {
        return this.readByte(offset) !== 0;
    }
    /**
     * Writes a boolean value.
     * @param v The boolean value to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeBool(v, offset) {
        return this.writeByte(Number(v), offset);
    }
    /**
     * Reads an unsigned 8-bit number.
     * @param offset The optional offset to read from.
     * @returns The read unsigned 8-bit number.
     */
    readUInt8(offset) {
        return this.view.getUint8(this.increaseOffset(1, offset).start);
    }
    /**
     * Writes an unsigned 8-bit number.
     * @param v The unsigned 8-bit number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeUInt8(v, offset) {
        const { start, end } = this.increaseOffset(1, offset);
        this.resize(end, false)
            .view
            .setUint8(start, v);
        return this;
    }
    /**
     * Reads a signed 8-bit number.
     * @param offset The optional offset to read from.
     * @returns The read signed 8-bit number.
     */
    readInt8(offset) {
        return this.view.getInt8(this.increaseOffset(1, offset).start);
    }
    /**
     * Writes a signed 8-bit number.
     * @param v The signed 8-bit number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeInt8(v, offset) {
        const { start, end } = this.increaseOffset(1, offset);
        this.resize(end, false)
            .view
            .setInt8(start, v);
        return this;
    }
    /**
     * Reads a 16-bit unsigned big-endian number.
     * @param offset The optional offset to read from.
     * @returns The read 16-bit unsigned big-endian number.
     */
    readUInt16BE(offset) {
        return this.view.getUint16(this.increaseOffset(2, offset).start);
    }
    /**
     * Writes a 16-bit unsigned big-endian number.
     * @param v The 16-bit unsigned big-endian number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeUInt16BE(v, offset) {
        const { start, end } = this.increaseOffset(2, offset);
        this.resize(end, false)
            .view
            .setUint16(start, v);
        return this;
    }
    /**
     * Reads a 16-bit signed big-endian number.
     * @param offset The optional offset to read from.
     * @returns The read 16-bit signed big-endian number.
     */
    readInt16BE(offset) {
        return this.view.getInt16(this.increaseOffset(2, offset).start);
    }
    /**
     * Writes a 16-bit signed big-endian number.
     * @param v The 16-bit signed big-endian number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeInt16BE(v, offset) {
        const { start, end } = this.increaseOffset(2, offset);
        this.resize(end, false)
            .view
            .setInt16(start, v);
        return this;
    }
    /**
     * Reads a 16-bit unsigned little-endian number.
     * @param offset The optional offset to read from.
     * @returns The read 16-bit unsigned little-endian number.
     */
    readUInt16LE(offset) {
        return this.view.getUint16(this.increaseOffset(2, offset).start, true);
    }
    /**
     * Writes a 16-bit unsigned little-endian number.
     * @param v The 16-bit unsigned little-endian number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeUInt16LE(v, offset) {
        const { start, end } = this.increaseOffset(2, offset);
        this.resize(end, false)
            .view
            .setUint16(start, v, true);
        return this;
    }
    /**
     * Reads a 16-bit signed little-endian number.
     * @param offset The optional offset to read from.
     * @returns The read 16-bit signed little-endian number.
     */
    readInt16LE(offset) {
        return this.view.getInt16(this.increaseOffset(2, offset).start, true);
    }
    /**
     * Reads a 32-bit unsigned big-endian number.
     * @param offset The optional offset to read from.
     * @returns The read 32-bit unsigned big-endian number.
     */
    readUInt32BE(offset) {
        return this.view.getUint32(this.increaseOffset(4, offset).start);
    }
    /**
     * Writes a 32-bit unsigned big-endian number.
     * @param v The 32-bit unsigned big-endian number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeUInt32BE(v, offset) {
        const { start, end } = this.increaseOffset(4, offset);
        this.resize(end, false)
            .view
            .setUint32(start, v);
        return this;
    }
    /**
     * Reads a 32-bit signed big-endian number
     */
    readInt32BE(offset) {
        return this.view.getInt32(this.increaseOffset(4, offset).start);
    }
    /**
     * Writes a 32-bit signed big-endian number
     */
    writeInt32BE(v, offset) {
        const { start, end } = this.increaseOffset(4, offset);
        this.resize(end, false)
            .view
            .setInt32(start, v);
        return this;
    }
    /**
     * Reads a 32-bit signed little-endian number
     */
    readInt32LE(offset) {
        return this.view.getInt32(this.increaseOffset(4, offset).start, true);
    }
    /**
     * Writes a 32-bit signed little-endian number
     */
    writeInt32LE(v) {
        const { start, end } = this.increaseOffset(4);
        this.resize(end, false)
            .view
            .setInt32(start, v, true);
        return this;
    }
    /**
     * Reads a 32-bit unsigned little-endian number
     */
    readUInt32LE(offset) {
        return this.view.getUint32(this.increaseOffset(4, offset).start, true);
    }
    /**
     * Writes a 32-bit unsigned little-endian number
     */
    writeUInt32LE(v, offset) {
        const { start, end } = this.increaseOffset(4, offset);
        this.resize(end, false)
            .view
            .setUint32(start, v, true);
        return this;
    }
    /**
     * Writes a 16-bit signed little-endian number.
     * @param v The 16-bit signed little-endian number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeInt16LE(v, offset) {
        const { start, end } = this.increaseOffset(2, offset);
        this.resize(end, false)
            .view
            .setInt16(start, v, true);
        return this;
    }
    /**
     * Reads a 3-byte big-endian number.
     * @param offset The optional offset to read from.
     * @returns The read 3-byte big-endian number.
     */
    readTriadBE(offset) {
        return this.readByte(offset) << 16 | this.readByte() << 8 | this.readByte();
    }
    /**
     * Writes a 3-byte big-endian number.
     * @param v The 3-byte big-endian number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeTriadBE(v, offset) {
        return this
            .writeByte(v >> 16 & 0xff, offset)
            .writeByte(v >> 8 & 0xff)
            .writeByte(v & 0xff);
    }
    /**
     * Reads a 3-byte little-endian number.
     * @param offset The optional offset to read from.
     * @returns The read 3-byte little-endian number.
     */
    readTriadLE(offset) {
        return this.readByte(offset) | this.readByte() << 8 | this.readByte() << 16;
    }
    /**
     * Writes a 3-byte little-endian number.
     * @param v The 3-byte little-endian number to write.
     * @param offset The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeTriadLE(v, offset) {
        return this
            .writeByte(v & 0xff, offset)
            .writeByte(v >> 8 & 0xff)
            .writeByte(v >> 16 & 0xff);
    }
    /**
     * Reads a 32-bit floating point number in big-endian format from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The 32-bit floating point number read from the binary stream.
     */
    readFloat32BE(offset) {
        return this.view.getFloat32(this.increaseOffset(4, offset).start);
    }
    /**
     * Writes a 32-bit floating-point number in big-endian format to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeFloat32BE(v, offset) {
        const { start, end } = this.increaseOffset(4, offset);
        this.resize(end, false)
            .view
            .setFloat32(start, v);
        return this;
    }
    /**
     * Reads a 32-bit floating-point number in little-endian format from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The 32-bit floating-point number read from the binary stream.
     */
    readFloat32LE(offset) {
        return this.view.getFloat32(this.increaseOffset(4, offset).start, true);
    }
    /**
     * Writes a 32-bit floating-point number in little-endian format to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeFloat32LE(v, offset) {
        const { start, end } = this.increaseOffset(4, offset);
        this.resize(end, false)
            .view
            .setFloat32(start, v, true);
        return this;
    }
    /**
     * Reads an 8-byte floating-point number in big-endian format from the binary stream.
     * @param offset - The optional offset to read from. If not provided, the current offset will be used.
     * @returns The 8-byte floating-point number read from the binary stream.
     */
    readFloat64BE(offset) {
        return this.view.getFloat64(this.increaseOffset(8, offset).start);
    }
    /**
     * Writes an 8-byte floating-point number in big-endian format to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeFloat64BE(v, offset) {
        const { start, end } = this.increaseOffset(8, offset);
        this.resize(end, false)
            .view
            .setFloat64(start, v);
        return this;
    }
    /**
     * Reads an 8-byte floating-point number in little-endian format from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The 8-byte floating-point number read from the binary stream.
     */
    readFloat64LE(offset) {
        return this.view.getFloat64(this.increaseOffset(8, offset).start, true);
    }
    /**
     * Writes an 8-byte floating-point number in little-endian format to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeFloat64LE(v, offset) {
        const { start, end } = this.increaseOffset(8, offset);
        this.resize(end, false)
            .view
            .setFloat64(start, v, true);
        return this;
    }
    /**
     * Reads an unsigned 64-bit big-endian integer from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The unsigned 64-bit big-endian integer read from the binary stream.
     */
    readBigUInt64BE(offset = this.offset) {
        return this.view.getBigUint64(this.increaseOffset(8, offset).start);
    }
    /**
     * Writes an unsigned 64-bit big-endian integer to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeBigUInt64BE(v, offset = this.offset) {
        const { start, end } = this.increaseOffset(8, offset);
        this.resize(end, false)
            .view
            .setBigUint64(start, v);
        return this;
    }
    /**
     * Reads an unsigned 64-bit little-endian integer from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The unsigned 64-bit little-endian integer read from the binary stream.
     */
    readBigUInt64LE(offset = this.offset) {
        return this.view.getBigUint64(this.increaseOffset(8, offset).start, true);
    }
    /**
     * Writes an unsigned 64-bit little-endian integer to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeBigUInt64LE(v, offset = this.offset) {
        const { start, end } = this.increaseOffset(8, offset);
        this.resize(end, false)
            .view
            .setBigUint64(start, v, true);
        return this;
    }
    /**
     * Reads an unsigned variable-length integer from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The unsigned variable-length integer read from the stream.
     */
    readUVarInt(offset = this.offset) {
        let value = 0;
        for (let i = 0; i <= 35; i += 7) {
            let b = this.readByte(offset++);
            value |= ((b & 0x7f) << i);
            if ((b & 0x80) === 0) {
                return value;
            }
        }
        return 0;
    }
    /**
     * Writes an unsigned variable-length integer to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeUVarInt(v, offset = this.offset) {
        for (let i = 0; i < 5; i++) {
            if ((v >> 7) !== 0) {
                this.writeByte(v | 0x80, offset++);
            }
            else {
                this.writeByte(v & 0x7f, offset++);
                break;
            }
            v >>= 7;
        }
        return this;
    }
    /**
     * Reads a variable-length integer from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The read variable-length integer.
     */
    readVarInt(offset) {
        let raw = this.readUVarInt(offset);
        let tmp = (((raw << 63) >> 63) ^ raw) >> 1;
        return tmp ^ (raw & (1 << 63));
    }
    /**
     * Writes a variable-length integer to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeVarInt(v, offset) {
        v <<= 32 >> 32;
        return this.writeUVarInt((v << 1) ^ (v >> 31), offset);
    }
    /**
     * Reads an unsigned variable-length long integer from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The unsigned variable-length long integer read from the stream.
     */
    readUVarLong(offset = this.offset) {
        let value = BigInt(0);
        for (let i = 0; i <= 63; i += 7) {
            let b = this.readByte(offset++);
            value |= BigInt((b & 0x7f) << i);
            if ((b & 0x80) === 0) {
                return value;
            }
        }
        return 0n;
    }
    /**
     * Writes an unsigned variable-length long integer to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeUVarLong(v, offset = this.offset) {
        while (v >= 0x80n) {
            this.writeByte(Number(v) | 0x80, offset++);
            v >>= 7n;
        }
        this.writeByte(Number(v), offset++);
        return this;
    }
    /**
     * Reads a variable-length long integer from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns The read long integer value.
     */
    readVarLong(offset) {
        let raw = this.readUVarLong(offset);
        let tmp = (((raw << 63n) >> 63n) ^ raw) >> 1n;
        return tmp ^ (raw & (1n << 63n));
    }
    /**
     * Writes a variable-length long integer to the binary stream.
     * @param v - The value to write.
     * @param offset - The optional offset at which to write the value.
     * @returns The updated BinaryStream instance.
     */
    writeVarLong(v, offset) {
        return this.writeUVarLong((v << 1n) ^ (v >> 63n), offset);
    }
    /**
     * Checks if the current offset has reached the end of the binary stream.
     * @returns A boolean indicating whether the end of the stream has been reached.
     */
    feof() {
        return this.offset >= this.length;
    }
    /**
     * Reads an Internet address from the binary stream.
     * @param offset - The optional offset to read from.
     * @returns An object representing the Internet address, including the address, port, and version.
     */
    readAddress(offset) {
        let address, port;
        let version = this.readByte(offset);
        switch (version) {
            default:
            case 4:
                let addr = [];
                for (let i = 0; i < 4; i++) {
                    addr.push(this.readByte() & 0xff);
                }
                address = addr.join(".");
                port = this.readUShort();
                break;
            case 6:
                let addr6 = [];
                for (let i = 0; i < 8; i++) {
                    addr6.push(this.readUShort().toString(16));
                }
                address = addr6.join(":");
                port = this.readUShort();
        }
        return { address, port, version };
    }
    /**
     * Writes an Internet address to the binary stream.
     * @param address - The Internet address to write.
     * @param offset - The optional offset to write at.
     * @returns The updated BinaryStream instance.
     */
    writeAddress({ address, port, version }, offset) {
        this.writeByte(version, offset);
        switch (version) {
            default:
            case 4:
                let parts = address.split(".", 4);
                for (let part of parts) {
                    this.writeByte((Number(part)) & 0xff);
                }
                this.writeUShort(port);
                break;
            case 6:
                let parts6 = address.split(":", 8);
                for (let part of parts6) {
                    this.writeUShort(parseInt(part, 16));
                }
                this.writeUShort(port);
        }
        return this;
    }
    /**
     * Flips the binary stream by resetting the offset to 0.
     * @returns The updated BinaryStream instance.
     */
    flip() {
        this.offset = 0;
        return this;
    }
    /**
     * Converts the binary stream to a string.
     * @param encoding - The encoding to use.
     * @returns The string representation of the binary stream.
     */
    toString(encoding = "utf8") {
        switch (encoding) {
            case "hex":
                return Array.from(this.buffer, byte => byte.toString(16).padStart(2, "0")).join("");
            default:
                if (encoding === "binary")
                    encoding = "latin1";
                return new TextDecoder(encoding).decode(this.view.buffer);
        }
    }
    /**
     * Splits the binary stream into chunks of the specified number of bytes.
     * @param bytes The number of bytes in each chunk.
     * @returns An array of Uint8Array chunks.
     */
    split(bytes) {
        let buffers = [];
        for (let i = 0; i < this.length; i += bytes) {
            buffers.push(this.view.buffer.slice(i, bytes));
        }
        return buffers.map(buffer => new Uint8Array(buffer));
    }
    static from(buf, encoding) {
        if (encoding === undefined) {
            return new BinaryStream(buf);
        }
        switch (encoding) {
            case "hex":
                let parts = /../g.exec(buf).map(part => parseInt(part, 16)).filter(part => !isNaN(part));
                return new BinaryStream(parts);
            case "utf8":
                return new BinaryStream(new TextEncoder().encode(buf));
            case "binary":
            case "latin1":
                return new BinaryStream(buf.split("").map(char => char.charCodeAt(0)));
            default:
                throw new Error(`Unsupported encoding: ${encoding}`);
        }
    }
    /**
     * Writes a string to the buffer
     */
    writeString(str, offset) {
        let buffer = new TextEncoder().encode(str);
        return this.writeUInt32BE(buffer.length, offset).write(buffer);
    }
    /**
     * Reads a string from the buffer
     */
    readString(offset) {
        let length = this.readUInt32BE(offset);
        return new TextDecoder().decode(this.read(length));
    }
};
