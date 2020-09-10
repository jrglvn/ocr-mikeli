export const extractAndFormatDate = (data: string): string => {
  let result = "";

  let tempResult = data.match(/\d{2,4}[\W\D]+\d{2}[\W\D]+\d{2,4}/);
  if (tempResult) {
    result = tempResult[0].replace(/[\W\D]+/g, "/"); //replace multiple // or \\
  }

  //because of arabic text direction sometimes google vision returns inversed date order
  //if years is on first position change order of items inside string
  if (result.match(/^\d{4}/)) {
    tempResult = result.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    if (tempResult)
      result = `${tempResult[3]}/${tempResult[2]}/${tempResult[1]}`;
  }

  return result;
};
