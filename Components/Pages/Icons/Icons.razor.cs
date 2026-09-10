using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using System.Data;
using System.Net.Http.Json;
using System.Net.NetworkInformation;
using UI.Components.Dialogs;
using Microsoft.AspNetCore.Components;
using UI.Models.Icons;

namespace UI.Components.Pages.Icons;

public partial class Icons
{
    private List<IconModel> icons = new List<IconModel>();
    private List<IconModel> _Icons = new List<IconModel>();

    ElementReference grid;

    int totalCount = 0, page = 0, Skip = 0;

    string _search = "";

    bool isLoading = false;

    protected override async void OnInitialized()
    {
        using var client = new HttpClient();

#if DEBUG
        icons = await client.GetFromJsonAsync<List<IconModel>>("https://localhost:7296/icons/icons.json");
#else
        icons = await client.GetFromJsonAsync<List<IconModel>>("https://ui.slvz.dev/icons/icons.json");
#endif

        totalCount = icons.Count();
        LoadNextBatch();
    }

    private async void LoadNextBatch()
    {
        if (isLoading) return;

        page++;

        isLoading = true;

        try
        {
            int count = 150;
            count = totalCount - _Icons.Count > 150 ? 150 : totalCount - _Icons.Count;

            if (count > 0)
            {
                
                var query = icons.AsQueryable();

                
                query = query.Where(x => (!string.IsNullOrEmpty(_search) ? x.Name.ToLower().Contains(_search.ToLower()) : true));

                var items = query.OrderByDescending(x => x.Name).Skip(Skip).Take(count).ToList();
                _Icons.AddRange(items);
                Skip += items.Count;
            }
        }
        catch { }

        StateHasChanged();
        isLoading = false;
    }


    private async void OnScroll()
    {
        try
        {
            var NewBatch = await Js.InvokeAsync<bool>("getNewBatch", grid);
            if (!isLoading && NewBatch)
                LoadNextBatch();
        }
        catch { }
    }

    //On press enter on searchbar
    private async void OnEnter(KeyboardEventArgs e)
    {
        if (e.Key == "Enter")
        {
            await Js.InvokeVoidAsync("ScrollToTop");
            _Icons.Clear();
            totalCount = page = Skip = 0;

            var query = icons.AsQueryable();
            query = query.Where(x =>(!string.IsNullOrEmpty(_search) ? x.Name.ToLower().Contains(_search.ToLower()) : true));
            totalCount = query.Count();

            LoadNextBatch();
        }
    }

    //On cancel search
    private async void OnCancelSearch()
    {
        _search = "";
        await Js.InvokeVoidAsync("ScrollToTop");
        _Icons.Clear();
        totalCount = page = Skip = 0;
        totalCount = icons.Count();
        LoadNextBatch();
    }

    private void OnIconClick(IconModel icon)
    {
        IconPreview.OpenDialog(icon);
    }

}
