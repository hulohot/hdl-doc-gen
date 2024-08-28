import VerilogParser from './VerilogParser';
import VHDLParser from './VHDLParser';

export default class ParserFactory {
  static createParser(hdlType, code) {
    switch (hdlType.toLowerCase()) {
      case 'verilog':
        return new VerilogParser(code);
      case 'vhdl':
        return new VHDLParser(code);
      default:
        throw new Error(`Unsupported HDL type: ${hdlType}`);
    }
  }
}