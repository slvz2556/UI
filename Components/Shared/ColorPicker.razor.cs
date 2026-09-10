using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using System.Globalization;

namespace UI.Components.Shared;

public partial class ColorPicker : ComponentBase, IAsyncDisposable
{
    // ---- Public API -------------------------------------------------

    /// <summary>Current color as "#rrggbb" (lowercase, 6 digits, no alpha).</summary>
    [Parameter] public string Value { get; set; } = "#ffffff";
    [Parameter] public EventCallback<string> ValueChanged { get; set; }

    /// <summary>Optional row of quick-pick swatches, each "#rrggbb".</summary>
    [Parameter] public List<string>? PresetColors { get; set; }

    // ---- Layout constants (kept in sync with ColorPicker.razor.css) --

    private const double SvWidth = 240;
    private const double SvHeight = 160;
    private const double HueWidth = 240;

    // ---- Internal state ------------------------------------------------

    private ElementReference _svElement;
    private ElementReference _hueElement;
    private IJSObjectReference? _module;

    private double Hue;        // 0-360
    private double Sat = 0;    // 0-1
    private double Val = 1;    // 0-1

    private int _r = 255, _g = 255, _b = 255;
    private string _hexInputText = "#ffffff";
    private string HexValue = "#ffffff";

    private bool _isDraggingSv;
    private bool _isDraggingHue;
    private string? _lastAppliedValue;

    private double SvThumbX => Sat * SvWidth;
    private double SvThumbY => (1 - Val) * SvHeight;
    private double HueThumbX => (Hue / 360.0) * HueWidth;

    protected override void OnParametersSet()
    {
        // Only re-sync from the incoming Value when it actually changed
        // externally (avoids fighting with our own ValueChanged echo).
        if (!string.Equals(Value, _lastAppliedValue, StringComparison.OrdinalIgnoreCase))
        {
            SyncFromHex(Value);
        }
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            // Small JS helper only used for native pointer capture, so
            // dragging keeps working even if the pointer leaves the
            // element bounds mid-drag. Adjust the path below to wherever
            // you deploy colorPicker.js (e.g. wwwroot/js/colorPicker.js).
            //_module = await JS.InvokeAsync<IJSObjectReference>("import", "./js/colorPicker.js");
        }
    }

    // ---- SV square dragging -----------------------------------------

    private async Task OnSvPointerDown(PointerEventArgs e)
    {
        _isDraggingSv = true;
        if (_module is not null)
            await _module.InvokeVoidAsync("capture", _svElement, e.PointerId);

        UpdateSvFromOffsets(e.OffsetX, e.OffsetY);
    }

    private void OnSvPointerMove(PointerEventArgs e)
    {
        if (!_isDraggingSv) return;
        UpdateSvFromOffsets(e.OffsetX, e.OffsetY);
    }

    private async Task OnSvPointerUp(PointerEventArgs e)
    {
        if (!_isDraggingSv) return;
        _isDraggingSv = false;
        if (_module is not null)
            await _module.InvokeVoidAsync("release", _svElement, e.PointerId);
    }

    private void UpdateSvFromOffsets(double offsetX, double offsetY)
    {
        Sat = Math.Clamp(offsetX / SvWidth, 0, 1);
        Val = Math.Clamp(1 - (offsetY / SvHeight), 0, 1);
        ApplyHsv();
    }

    // ---- Hue bar dragging ---------------------------------------------

    private async Task OnHuePointerDown(PointerEventArgs e)
    {
        _isDraggingHue = true;
        if (_module is not null)
            await _module.InvokeVoidAsync("capture", _hueElement, e.PointerId);

        UpdateHueFromOffset(e.OffsetX);
    }

    private void OnHuePointerMove(PointerEventArgs e)
    {
        if (!_isDraggingHue) return;
        UpdateHueFromOffset(e.OffsetX);
    }

    private async Task OnHuePointerUp(PointerEventArgs e)
    {
        if (!_isDraggingHue) return;
        _isDraggingHue = false;
        if (_module is not null)
            await _module.InvokeVoidAsync("release", _hueElement, e.PointerId);
    }

    private void UpdateHueFromOffset(double offsetX)
    {
        Hue = Math.Clamp(offsetX / HueWidth, 0, 1) * 360.0;
        ApplyHsv();
    }

    // ---- Hex / RGB text inputs -----------------------------------------

    private void OnHexInputChanged(ChangeEventArgs e)
    {
        var text = (e.Value as string)?.Trim() ?? "";
        if (!TryParseHex(text, out var r, out var g, out var b))
        {
            // Invalid input: snap the text back to the last valid value
            // instead of silently accepting garbage.
            // TODO: forward a validation message to native MessageBox if desired.
            _hexInputText = HexValue;
            return;
        }

        (_r, _g, _b) = (r, g, b);
        (Hue, Sat, Val) = RgbToHsv(r, g, b);
        ApplyRgb();
    }

    private void OnRgbChanged(ChangeEventArgs e, int channel)
    {
        if (!int.TryParse(e.Value as string, NumberStyles.Integer, CultureInfo.InvariantCulture, out var v))
            return;

        v = Math.Clamp(v, 0, 255);
        switch (channel)
        {
            case 0: _r = v; break;
            case 1: _g = v; break;
            case 2: _b = v; break;
        }

        (Hue, Sat, Val) = RgbToHsv(_r, _g, _b);
        ApplyRgb();
    }

    private void SelectPreset(string hex) => SyncFromHex(hex, notify: true);

    // ---- Core sync helpers -----------------------------------------------

    private void ApplyHsv()
    {
        var (r, g, b) = HsvToRgb(Hue, Sat, Val);
        (_r, _g, _b) = (r, g, b);
        ApplyRgb();
    }

    private void ApplyRgb()
    {
        HexValue = RgbToHex(_r, _g, _b);
        _hexInputText = HexValue;
        _ = NotifyValueChanged();
    }

    private async Task NotifyValueChanged()
    {
        _lastAppliedValue = HexValue;
        if (ValueChanged.HasDelegate)
            await ValueChanged.InvokeAsync(HexValue);
    }

    private void SyncFromHex(string? hex, bool notify = false)
    {
        if (!TryParseHex(hex ?? "", out var r, out var g, out var b))
        {
            r = g = b = 255; // fall back to white on bad/empty input
        }

        (_r, _g, _b) = (r, g, b);
        (Hue, Sat, Val) = RgbToHsv(r, g, b);
        HexValue = RgbToHex(r, g, b);
        _hexInputText = HexValue;
        _lastAppliedValue = HexValue;

        if (notify)
            _ = NotifyValueChanged();
    }

    public async ValueTask DisposeAsync()
    {
        if (_module is not null)
        {
            try { await _module.DisposeAsync(); }
            catch (JSDisconnectedException) { /* app is shutting down, safe to ignore */ }
        }
    }

    // ---- Color math --------------------------------------------------

    private static bool TryParseHex(string input, out int r, out int g, out int b)
    {
        r = g = b = 0;
        var s = input.TrimStart('#');

        if (s.Length == 3)
            s = string.Concat(s.Select(c => new string(c, 2)));

        if (s.Length != 6)
            return false;

        return int.TryParse(s[0..2], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out r)
            && int.TryParse(s[2..4], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out g)
            && int.TryParse(s[4..6], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out b);
    }

    private static string RgbToHex(int r, int g, int b)
        => $"#{r:x2}{g:x2}{b:x2}";

    private static (double h, double s, double v) RgbToHsv(int r, int g, int b)
    {
        double rf = r / 255.0, gf = g / 255.0, bf = b / 255.0;
        double max = Math.Max(rf, Math.Max(gf, bf));
        double min = Math.Min(rf, Math.Min(gf, bf));
        double delta = max - min;

        double h;
        if (delta == 0) h = 0;
        else if (max == rf) h = 60 * (((gf - bf) / delta) % 6);
        else if (max == gf) h = 60 * (((bf - rf) / delta) + 2);
        else h = 60 * (((rf - gf) / delta) + 4);
        if (h < 0) h += 360;

        double s = max == 0 ? 0 : delta / max;
        double v = max;

        return (h, s, v);
    }

    private static (int r, int g, int b) HsvToRgb(double h, double s, double v)
    {
        double c = v * s;
        double x = c * (1 - Math.Abs((h / 60.0) % 2 - 1));
        double m = v - c;

        (double r, double g, double b) = h switch
        {
            < 60 => (c, x, 0.0),
            < 120 => (x, c, 0.0),
            < 180 => (0.0, c, x),
            < 240 => (0.0, x, c),
            < 300 => (x, 0.0, c),
            _ => (c, 0.0, x),
        };

        return (
            (int)Math.Round((r + m) * 255),
            (int)Math.Round((g + m) * 255),
            (int)Math.Round((b + m) * 255)
        );
    }
}
